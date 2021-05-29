use crate::{account_cli, GodwokenUser, Spec};
use std::env;

/// Simple User-Defined Token
pub struct SudtAsset;

impl Spec for SudtAsset {
    fn run(&self) {
        println!("===============\nsUDT test cases\n===============");
        // TODO: issueToken: issue new SUDT on CKB for test

        let ckb_rpc: String =
            env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());

        let mut miner = GodwokenUser {
            private_key: env::var("MINER_PRIVATE_KEY").unwrap_or_else(|_| {
                "0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b".to_string()
            }),
            pub_ckb_addr: env::var("MINER_CKB_ADDR")
                .unwrap_or_else(|_| "ckt1qyqy84gfm9ljvqr69p0njfqullx5zy2hr9kq0pd3n5".to_string()),
            ckb_balance: 0,
            account_script_hash: None,
            gw_account_id: None,
            sudt_id: None,
            l1_sudt_script_hash: None,
            sudt_script_args: env::var("MINER_SUDT_SCRIPT_ARGS").ok(),
        };

        let mut user1 = GodwokenUser {
            private_key: env::var("USER1_PRIVATE_KEY").unwrap_or_else(|_| {
                "0x6cd5e7be2f6504aa5ae7c0c04178d8f47b7cfc63b71d95d9e6282f5b090431bf".to_string()
            }),
            pub_ckb_addr: env::var("USER1_CKB_ADDR")
                .unwrap_or_else(|_| "ckt1qyqf22qfzaer95xm5d2m5km0f6k288x9warqnhsf4m".to_string()),
            ckb_balance: 0,
            account_script_hash: None,
            gw_account_id: None,
            sudt_id: None,
            l1_sudt_script_hash: None,
            sudt_script_args: env::var("USER1_SUDT_SCRIPT_ARGS").ok(),
            //TODO: get "sudt-script-args" by private-key
        };

        // deposit sudt from layer1 to layer2 and get gw_account_id, sudt_id and etc.
        if !miner.deposit_sudt(1000000000) {
            println!("\n[Note] Miner should issue a SUDT token first.\n");
            panic!("Miner's deposit failed.");
        }
        if !user1.deposit_sudt(1000000000) {
            println!("\n[Note] User1 should issue a SUDT token first.\n");
            panic!("User1's deposit failed.")
        }

        // get_sudt_balance
        let miner_sudt4_balance_record = miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        println!("miner's sudt4 balance: {}", miner_sudt4_balance_record);
        let use1_sudt4_balance_record = user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        println!("user1's sudt4 balance: {}", use1_sudt4_balance_record);

        // transfer
        println!("\nTransfer 100000000 sUDT from miner to user1");
        let _transfer_status = account_cli()
            .arg("transfer")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &miner.private_key])
            .args(&["--amount", "100000000"])
            .args(&["--fee", "0"])
            .args(&["--to-id", &user1.gw_account_id.unwrap().to_string()])
            .args(&["--sudt-id", &miner.sudt_id.unwrap().to_string()])
            .status()
            .expect("failed to transfer");

        // withdraw Usage: account-cli withdraw [options]
        // withdraw CKB / sUDT from godwoken
        // Options:
        // -p, --private-key <privateKey>              private key to use
        // -c, --capacity <capacity>                   capacity in shannons
        // -o --owner-ckb-address <owner ckb address>  owner ckb address (to)
        // -s --sudt-script-hash <sudt script hash>    l1 sudt script hash, default for withdrawal CKB (default: "0x0000000000000000000000000000000000000000000000000000000000000000")
        // -m --amount <amount>                        amount of sudt (default: "0")
        // -r, --rpc <rpc>                             ckb rpc path (default: "http://127.0.0.1:8114")
        // -d, --indexer-path <path>                   indexer path (default: "./indexer-data")
        // -h, --help                                  display help for command
        println!("\nuser1 withdraw 60000000 SUDT5 from godwoken");
        let user1_usdt5_balance_record = user1.get_sudt_balance(user1.sudt_id.unwrap()).unwrap();
        let _withdrawal_status = account_cli()
            .arg("withdraw")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &user1.private_key])
            .args(&["--amount", "60000000"]) // -m --amount <amount> amount of sudt (default: "0")
            .args(&[
                // l1 sudt script hash
                "--sudt-script-hash",
                &user1.l1_sudt_script_hash.as_ref().unwrap().to_string(),
            ])
            .args(&["--owner-ckb-address", &user1.pub_ckb_addr]) // ckt1qyqy84gfm9ljvqr69p0njfqullx5zy2hr9kq0pd3n5
            .args(&["--capacity", "10000000000"]) // 40,000,000,000 Shannons = 400 CKBytes
            .status();
        assert_eq!(
            user1_usdt5_balance_record - 60000000,
            user1.get_sudt_balance(user1.sudt_id.unwrap()).unwrap()
        );

        // check balance changes after the transfer
        assert_eq!(
            miner_sudt4_balance_record - 100000000,
            miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );
        assert_eq!(
            use1_sudt4_balance_record + 100000000,
            user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );
    }
}
