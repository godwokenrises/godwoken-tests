use anyhow::{anyhow, Result};
use regex::Regex;
use std::{
    io::{BufRead, BufReader},
    process::Stdio,
};

pub mod specs;
pub mod util;
pub use specs::Spec;
pub use util::cli::account_cli;
pub mod worker;

/// The 32-byte fixed-length binary data, Represent 256 bits
///
/// The name comes from the number of bits in the data.
///
/// In JSONRPC, it is encoded as a 0x-prefixed hex string.
#[derive(Eq, PartialEq, Debug, Default, Hash, Clone, Copy)]
pub struct H256([u8; 32]);
// pub struct H256(pub [u8; 32]);

pub const CKB_SUDT_ID: u32 = 1;
pub const X_SUDT_ID: u32 = 2;

pub struct GodwokenUser {
    private_key: String,
    pub_ckb_addr: String,
    gw_account_id: Option<u32>, //TODO: get gw_account_id by privateKey
    ckb_balance: u128,
    account_script_hash: Option<String>, //TODO: sudt_balance[]
    sudt_script_args: Option<String>,
    sudt_id: Option<u32>,
    l1_sudt_script_hash: Option<String>,
}

impl GodwokenUser {
    /// Deprecated
    #[allow(dead_code)]
    fn get_balance(&mut self) -> Result<u128> {
        if self.gw_account_id.is_none() {
            return Err(anyhow!("Missing gw_account_id: {:?}", self.gw_account_id));
        }

        let pattern: Regex = Regex::new(r"[B|b]alance: (\d+)").unwrap();
        let balance_output = account_cli()
            .arg("get-balance")
            .args(&["--account-id", &self.gw_account_id.unwrap().to_string()])
            .output()
            .expect("failed to get-balance");
        let stdout_text = String::from_utf8(balance_output.stdout).unwrap_or_default();
        let balance_str = if let Some(cap) = pattern.captures(&stdout_text) {
            if cap.len() > 1 {
                cap.get(1).unwrap().as_str()
            } else {
                "0"
            }
        } else {
            let err_text = String::from_utf8(balance_output.stderr).unwrap_or_default();
            return Err(anyhow!(
                "no balance logs returned: {} || {}",
                &err_text,
                &stdout_text
            ));
        };
        self.ckb_balance = u128::from_str_radix(balance_str, 10).unwrap();
        Ok(self.ckb_balance)
    }

    fn get_sudt_balance(&mut self, sudt_id: u32) -> Result<u128> {
        if self.gw_account_id.is_none() {
            return Err(anyhow!("Missing gw_account_id: {:?}", self.gw_account_id));
        }

        let pattern: Regex = Regex::new(r"[B|b]alance: (\d+)").unwrap();
        // Desired output:
        // Your balance: (\d+)
        // Easy to read: 320,000,000,000
        let balance_output = account_cli()
            .arg("get-balance")
            .args(&["--account-id", &self.gw_account_id.unwrap().to_string()])
            .args(&["--sudt-id", &sudt_id.to_string()])
            .output()
            .expect("failed to get_sudt_balance");
        let stdout_text = String::from_utf8(balance_output.stdout).unwrap_or_default();
        let balance_str = if let Some(cap) = pattern.captures(&stdout_text) {
            cap.get(1).unwrap().as_str()
        } else {
            let err_text = String::from_utf8(balance_output.stderr).unwrap_or_default();
            return Err(anyhow!(
                "no balance logs returned: {} || {}",
                &err_text,
                &stdout_text
            ));
        };

        let balance = u128::from_str_radix(balance_str, 10).unwrap();
        if sudt_id == CKB_SUDT_ID {
            self.ckb_balance = balance;
            Ok(self.ckb_balance)
        } else {
            Ok(balance)
        }
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
    /// -l, --eth-address <args>                     Eth address (layer2 lock args, using --private-key 																						 value to calculate if not provided)
    /// -c, --capacity <capacity>                    capacity in shannons (default: "40000000000")
    /// -h, --help
    fn deposit_sudt(&mut self, amount: u128) -> bool {
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
        // Layer 2 sudt script hash: 0x48b50a572d660cb7458a30159422ee20bda4918ca274d390a878ffff67e3aba3
        // TODO(fn): ↑ Using this script hash to get sudt account id ↑
        // let ckb_balance_pattern = Regex::new(r"ckb balance in godwoken is: (\d+)").unwrap();

        let mut ret = false;
        BufReader::new(deposit_stdout)
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| {
                println!("{}", &line);
                // update account_script_hash
                if self.account_script_hash.is_none() {
                    if let Some(cap) = script_hash_pattern.captures(&line) {
                        self.account_script_hash = Some(cap.get(1).unwrap().as_str().to_string());
                        println!(
                            "=> update account_script_hash to {:?}",
                            self.account_script_hash
                        );
                    }
                }
                // update l1_sudt_script_hash
                if self.l1_sudt_script_hash.is_none() {
                    if let Some(cap) = l1_sudt_script_hash_pattern.captures(&line) {
                        self.l1_sudt_script_hash = Some(cap.get(1).unwrap().as_str().to_string());
                        println!(
                            "=> update l1_sudt_script_hash to {:?}",
                            self.l1_sudt_script_hash
                        );
                    }
                }
                // update gw_account_id
                if self.gw_account_id.is_none() {
                    if let Some(cap) = account_id_pattern.captures(&line) {
                        self.gw_account_id = cap.get(1).unwrap().as_str().parse::<u32>().ok();
                        println!("=> update gw_account_id to {:?}", self.gw_account_id);
                    }
                }
                // update sudt_id
                if self.sudt_id.is_none() {
                    if let Some(cap) = sudt_id_pattern.captures(&line) {
                        self.sudt_id = cap.get(1).unwrap().as_str().parse::<u32>().ok();
                        println!("=> update sudt_id to {:?}", self.sudt_id);
                    }
                }
                if line.contains("deposit success!") {
                    ret = true;
                }
            });
        return ret;
    }
}
