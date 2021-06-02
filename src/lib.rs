use anyhow::{anyhow, Result};
use regex::Regex;
use std::{
    io::{BufRead, BufReader},
    process::Stdio,
};

pub mod specs;
pub mod types;
pub mod util;
pub mod worker;

pub use specs::Spec;
pub use util::cli::account_cli;

use types::{CKB_SUDT_ID, CKB_SUDT_SCRIPT_HASH};
use util::cli::{godwoken_cli, issue_token_cli};
use util::godwoken_ctl::GodwokenCtl;
use util::read_data_from_stdout;

pub struct GodwokenUser {
    private_key: String,
    pub_ckb_addr: String,
    gw_account_id: Option<u32>,
    ckb_balance: u128,
    account_script_hash: Option<String>,
    sudt_script_args: Option<String>,
    sudt_id: Option<u32>,
    l1_sudt_script_hash: Option<String>,
}

impl GodwokenUser {
    /// get gw_account_id by privateKey
    fn get_account_id(&mut self) -> Option<u32> {
        if self.gw_account_id.is_some() {
            return self.gw_account_id;
        }
        let output = godwoken_cli()
            .args(&["getAccountId", &self.private_key])
            .output()
            .expect("failed to get account ID.");
        let id_str = read_data_from_stdout(output, r"Account id: (\d+)", "no account id returned.");
        self.gw_account_id = id_str.parse::<u32>().ok();
        self.gw_account_id
    }

    fn get_balance(&mut self) -> Result<u128> {
        self.get_sudt_balance(CKB_SUDT_ID)
    }

    fn get_sudt_balance(&mut self, sudt_id: u32) -> Result<u128> {
        if self.gw_account_id.is_none() && self.get_account_id().is_none() {
            return Err(anyhow!("Missing gw_account_id: {:?}", self.gw_account_id));
        }

        let balance_output = account_cli()
            .arg("get-balance")
            .args(&["--account-id", &self.gw_account_id.unwrap().to_string()])
            .args(&["--sudt-id", &sudt_id.to_string()])
            .output()
            .expect("failed to get_sudt_balance");
        let balance_str = util::read_data_from_stdout(
            balance_output,
            r"[B|b]alance: (\d+)",
            "no balance logs returned",
        );
        let balance = balance_str.parse::<u128>().unwrap();

        if sudt_id == CKB_SUDT_ID {
            self.ckb_balance = balance;
            Ok(self.ckb_balance)
        } else {
            Ok(balance)
        }
    }

    /// get sudt-script-args by private-key
    fn get_sudt_script_args(&mut self) -> Option<&String> {
        if self.sudt_script_args.is_some() {
            return self.sudt_script_args.as_ref();
        }
        let output = account_cli()
            .arg("get-sudt-script-args")
            .args(&["--private-key", &self.private_key])
            .output()
            .expect("failed to get sudt script args");
        self.sudt_script_args = Some(read_data_from_stdout(
            output,
            r"sudt script args: ([0-9a-fA-F]*)[\n\t\s]",
            "no sudt script args returned",
        ));
        self.sudt_script_args.as_ref()
    }

    fn issue_sudt(&self, amount: u128) {
        let _output = issue_token_cli()
            .args(&["--private-key", &self.private_key])
            .args(&["--amount", &amount.to_string()])
            // .args(&["--capacity", &capcity.to_string()])
            .output()
            .expect("failed to issue token.");

        // TODO: let _l1_tx_hash = read_data_from_stdout(
        //     output,
        //     r"txHash: (0x[0-9a-fA-F]*)[\n\t\s]",
        //     "layer1 tx hash not found",
        // );
        // TODO: check the txHash of issuing token: 0x40439edc7be40aadc504504dbb3ce1ed6c7626699dbb701f03dbc35a7b8b61c3
    }

    /// call account-cli to deposit CKB from layer1 to layer2
    fn deposit_ckb(&self, capacity: u128) -> bool {
        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
        let output = account_cli()
            .arg("deposit")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &self.private_key])
            .args(&["-c", &capacity.to_string()]) // 600 CKBytes = 60,000,000,000 Shannons
            .output()
            .expect("faild to deposit CKB");
        let stdo = String::from_utf8(output.stdout).unwrap_or_default();
        log::debug!("{}", &stdo);
        stdo.contains("deposit success!")
    }

    /// deposit sudt issued by himself from layer1 to layer2
    ///
    /// Cli Usage: account-cli deposit-sudt [options]
    ///
    /// deposit sUDT to godwoken
    ///
    /// Options:
    /// -p, --private-key <privateKey>               private key to use
    /// -m --amount <amount>                         sudt amount
    /// -s --sudt-script-args <l1 sudt script args>  sudt amount
    /// -r, --rpc <rpc>                              ckb rpc path (default: "http://127.0.0.1:8114")
    /// -d, --indexer-path <path>                    indexer path (default: "./indexer-data")
    /// -l, --eth-address <args>                     Eth address (layer2 lock args, using --private-key value to calculate if not provided)
    /// -c, --capacity <capacity>                    capacity in shannons (default: "40000000000")
    /// -h, --help
    fn deposit_sudt(&mut self, amount: u128) -> bool {
        if self.get_sudt_script_args().is_none() {
            log::warn!("Missing sudt_script_args: {:?}", self.sudt_script_args);
            return false;
        }

        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
        let deposit_stdout = account_cli()
            .arg("deposit-sudt")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &self.private_key])
            .args(&[
                "--sudt-script-args",
                &self.sudt_script_args.as_ref().unwrap(),
            ]) // -s --sudt-script-args <l1 sudt script args>
            .args(&["--amount", &amount.to_string()]) //sudt amount
            // .args(&["-c", "40000000000"]) // capacity in shannons (default: "40000000000")
            .stdout(Stdio::piped())
            .spawn()
            .unwrap()
            .stdout
            .unwrap();

        // call account-cli to deposit, get the script hash, gw_account_id and sudt id
        let script_hash_pattern = Regex::new(r"Layer 2 lock script hash: (0x.{64})").unwrap();
        let account_id_pattern = Regex::new(r"Your account id: (\d+)").unwrap();
        let sudt_id_pattern = Regex::new(r"Your sudt id: (\d+)").unwrap();
        let l1_sudt_script_hash_pattern =
            Regex::new(r"Layer 1 sudt script hash: (0x.{64})").unwrap();
        // let ckb_balance_pattern = Regex::new(r"ckb balance in godwoken is: (\d+)").unwrap();

        let mut ret = false;
        BufReader::new(deposit_stdout)
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| {
                log::debug!("{}", &line);
                // update account_script_hash
                if self.account_script_hash.is_none() {
                    if let Some(cap) = script_hash_pattern.captures(&line) {
                        self.account_script_hash = Some(cap.get(1).unwrap().as_str().to_string());
                        log::debug!(
                            "=> update account_script_hash to {:?}",
                            self.account_script_hash
                        );
                    }
                }
                // update l1_sudt_script_hash
                if self.l1_sudt_script_hash.is_none() {
                    if let Some(cap) = l1_sudt_script_hash_pattern.captures(&line) {
                        self.l1_sudt_script_hash = Some(cap.get(1).unwrap().as_str().to_string());
                        log::debug!(
                            "=> update l1_sudt_script_hash to {:?}",
                            self.l1_sudt_script_hash
                        );
                    }
                }
                // update gw_account_id
                if self.gw_account_id.is_none() {
                    if let Some(cap) = account_id_pattern.captures(&line) {
                        self.gw_account_id = cap.get(1).unwrap().as_str().parse::<u32>().ok();
                        log::debug!("=> update gw_account_id to {:?}", self.gw_account_id);
                    }
                }
                // update sudt_id
                if self.sudt_id.is_none() {
                    if let Some(cap) = sudt_id_pattern.captures(&line) {
                        self.sudt_id = cap.get(1).unwrap().as_str().parse::<u32>().ok();
                        log::debug!("=> update sudt_id to {:?}", self.sudt_id);
                    }
                }
                if line.contains("deposit success!") {
                    ret = true;
                }
            });
        ret
    }

    fn transfer(&self, sudt_id: u32, amount: u128, to_id: u32) {
        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
        let output = account_cli()
            .arg("transfer")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &self.private_key])
            .args(&["--amount", &amount.to_string()])
            .args(&["--fee", "0"]) // TODO: calc fee
            .args(&["--to-id", &to_id.to_string()])
            .args(&["--sudt-id", &sudt_id.to_string()])
            .output()
            .expect("failed to transfer");
        let l2_tx_hash = read_data_from_stdout(
            output,
            r"l2 tx hash: (0x[0-9a-fA-F]*)[\n\t\s]",
            "no l2_tx_hash returned.",
        );
        log::info!("layer2 transaction hash: {}", &l2_tx_hash);
        let receipt = GodwokenCtl::new().get_transaction_receipt(&l2_tx_hash);
        log::debug!("transaction receipt: {}", &receipt);
    }

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
    fn withdraw(&self, l1_sudt_script_hash: &str, mut amount: u128, to_ckb_addr: &str) -> bool {
        let mut ckb_shannons_capacity = 10000000000;
        if l1_sudt_script_hash == CKB_SUDT_SCRIPT_HASH {
            ckb_shannons_capacity = amount;
            amount = 0;
        }
        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
        let output = account_cli()
            .arg("withdraw")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &self.private_key])
            .args(&["--amount", &amount.to_string()]) // -m --amount <amount> amount of sudt (default: "0")
            .args(&["--sudt-script-hash", &l1_sudt_script_hash]) // l1 sudt script hash
            .args(&["--owner-ckb-address", &to_ckb_addr]) // ckt1qyqy84gfm9ljvqr69p0njfqullx5zy2hr9kq0pd3n5
            .args(&["--capacity", &ckb_shannons_capacity.to_string()])
            .output()
            .expect("failed to withdraw");
        let stdo = String::from_utf8(output.stdout).unwrap_or_default();
        log::debug!("{}", &stdo);
        stdo.contains("withdrawal success!")
    }
}
