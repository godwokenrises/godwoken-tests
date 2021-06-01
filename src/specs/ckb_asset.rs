use crate::util::cli::account_cli;
use crate::util::godwoken_ctl::GodwokenCtl;
use crate::util::read_data_from_stdout;
use crate::{Spec, CKB_SUDT_ID};
use regex::Regex;
use std::env;
use std::{
    io::{BufRead, BufReader},
    process::Stdio,
};

//TODO: https://docs.rs/env_logger/0.8.3/env_logger/
//TODO: Redirect both stdout and stderr of child process to the same file

pub struct CkbAsset;
impl Spec for CkbAsset {
    /// Case:
    ///   1. deposit CKB from layer1 to layer2
    ///   2. godwoken transfer from MINER to USER1
    ///   3. withdraw CKB from layer2 to layer1
    fn run(&self) {
        println!("==================\nCkbAsset Test Case\n==================\n* invoke account-cli to deposit -> transfer -> withdraw");

        let ckb_rpc: String =
            env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());

        let (mut miner, mut user1) = crate::util::get_signers();
        // call account-cli to deposit, get the script hash and gw_account_id
        // when the deposit finished.
        let script_hash_pattern = Regex::new(r"script hash: (0x.{64})").unwrap();
        let ckb_balance_pattern = Regex::new(r"ckb balance in godwoken is: (\d+)").unwrap();
        let account_id_pattern = Regex::new(r"Your account id: (\d+)").unwrap();

        let miner_deposit_stdout = account_cli()
            .arg("deposit")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &miner.private_key])
            .args(&["-c", "60000000000"]) // 600 CKBytes = 60,000,000,000 Shannons
            .stdout(Stdio::piped())
            .spawn()
            .unwrap()
            .stdout
            .unwrap();
        let mut last_ckb_balance_line = BufReader::new(miner_deposit_stdout)
            .lines()
            .filter_map(|line| line.ok())
            .filter(|line| {
                println!("{}", &line);
                // update account_script_hash
                if miner.account_script_hash.is_none() {
                    if let Some(cap) = script_hash_pattern.captures(&line) {
                        miner.account_script_hash = Some(cap.get(1).unwrap().as_str().to_string());
                        println!(
                            "=> update miner.account_script_hash to {:?}",
                            miner.account_script_hash
                        );
                    }
                }
                // update gw_account_id
                if miner.gw_account_id.is_none() {
                    if let Some(cap) = account_id_pattern.captures(&line) {
                        miner.gw_account_id = cap.get(1).unwrap().as_str().parse::<u32>().ok();
                        println!("=> update miner.gw_account_id to {:?}", miner.gw_account_id);
                    }
                }
                // filter the balance lines
                line.starts_with("ckb balance")
            })
            .last();
        if let Some(cap) = ckb_balance_pattern.captures(last_ckb_balance_line.unwrap().as_str()) {
            miner.ckb_balance = cap.get(1).unwrap().as_str().parse::<u128>().unwrap();
        };

        let user1_deposit_stdout = account_cli()
            .arg("deposit")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &user1.private_key])
            .args(&["-c", "30000000000"]) // 300 CKBytes = 30,000,000,000 Shannons
            .stdout(Stdio::piped())
            .spawn()
            .unwrap()
            .stdout
            .unwrap();
        last_ckb_balance_line = BufReader::new(user1_deposit_stdout)
            .lines()
            .filter_map(|line| line.ok())
            .filter(|line| {
                println!("{}", &line);
                // update account_script_hash
                if user1.account_script_hash.is_none() {
                    if let Some(cap) = script_hash_pattern.captures(&line) {
                        user1.account_script_hash = Some(cap.get(1).unwrap().as_str().to_string());
                        println!(
                            "=> update user1.account_script_hash to {:?}",
                            user1.account_script_hash
                        );
                    }
                }
                // update gw_account_id
                if user1.gw_account_id.is_none() {
                    if let Some(cap) = account_id_pattern.captures(&line) {
                        user1.gw_account_id = cap.get(1).unwrap().as_str().parse::<u32>().ok();
                        println!("=> update user1.gw_account_id to {:?}", user1.gw_account_id);
                    }
                }
                // filter the balance lines
                line.starts_with("ckb balance")
            })
            .last();
        if let Some(cap) = ckb_balance_pattern.captures(last_ckb_balance_line.unwrap().as_str()) {
            user1.ckb_balance = cap.get(1).unwrap().as_str().parse::<u128>().unwrap();
        };

        let miner_balance_record = miner.get_balance().unwrap();
        println!("miner_balance_record: {}", miner_balance_record);
        assert_eq!(miner.ckb_balance, miner_balance_record);
        let user1_balance_record = user1.get_balance().unwrap();
        println!("user1_balance_record: {}", user1_balance_record);
        assert_eq!(user1.ckb_balance, user1_balance_record);

        println!("* Transfer 111 Shannons (CKB) from miner to user1");
        let output = account_cli()
            .arg("transfer")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &miner.private_key])
            .args(&["--amount", "111"])
            .args(&["--fee", "0"])
            .args(&["--to-id", &user1.gw_account_id.unwrap().to_string()])
            .args(&["--sudt-id", &CKB_SUDT_ID.to_string()])
            .output()
            .expect("failed to transfer");
        let l2_tx_hash = read_data_from_stdout(
            output,
            r"l2 tx hash: (0x[0-9a-fA-F]*)[\n\t\s]",
            "no l2_tx_hash returned.",
        );
        println!("layer2 transaction hash: {}", &l2_tx_hash);
        GodwokenCtl::get_transaction_receipt(&l2_tx_hash);

        println!("miner_balance_record: {:?}", miner.get_balance());
        println!("user1_balance_record: {:?}", user1.get_balance());
        assert_eq!(miner.ckb_balance, miner_balance_record - 111);
        assert_eq!(user1.ckb_balance, user1_balance_record + 111);

        // withdraw
        let miner_balance_record = miner.ckb_balance;
        let user1_balance_record = user1.ckb_balance;
        println!("* miner withdraw 40000000000 shannons (CKB) from godwoken");
        let mut _withdrawal_status = account_cli()
            .arg("withdraw")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &miner.private_key])
            .args(&["--owner-ckb-address", &miner.pub_ckb_addr])
            .args(&["--capacity", "40000000000"]) // 40,000,000,000 Shannons = 400 CKBytes
            .status();
        println!("* user1 withdraw 10000000000 shannons (CKB) from godwoken");
        _withdrawal_status = account_cli()
            .arg("withdraw")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &user1.private_key])
            .args(&["--owner-ckb-address", &user1.pub_ckb_addr])
            .args(&["--capacity", "10000000000"])
            .status();

        println!("miner_balance_record: {:?}", miner.get_balance());
        println!("user1_balance_record: {:?}", user1.get_balance());
        assert_eq!(miner.ckb_balance, miner_balance_record - 40000000000);
        assert_eq!(user1.ckb_balance, user1_balance_record - 10000000000);
    }
}
