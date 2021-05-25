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
}

impl GodwokenUser {
    /// Deprecated
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

    /// deposit sudt from layer1 to layer2
    fn deposit(&mut self) -> Result<u128> {
        // TODO: fn get_envs
        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());

        let deposit_stdout = account_cli()
            .arg("deposit-sudt")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &self.private_key])
            .args(&[
                "--sudt-script-args",
                &self.sudt_script_args.as_ref().unwrap()
            ]) // -s --sudt-script-args <l1 sudt script args>
            .args(&["--amount", "80000000000"]) //sudt amount
            // .args(&["-c", "40000000000"]) // capacity in shannons (default: "40000000000")
            .stdout(Stdio::piped())
            .spawn()
            .unwrap()
            .stdout
            .unwrap();

        let _last_balance_line = BufReader::new(deposit_stdout)
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| {
                println!("{}", &line);
            });
        // .filter(|line| {
        // 		println!("{}", &line);
        // 		// filter the balance lines
        // 		line.starts_with("ckb balance")
        // })
        // .last();

        // if let Some(cap) = ckb_balance_pattern.captures(last_ckb_balance_line.unwrap().as_str()) {
        //     miner.ckb_balance = cap.get(1).unwrap().as_str().parse::<u128>().unwrap();
        //     // TODO: println
        // };

        // waiting for layer 2 block producer collect the deposit cell ... 0 seconds
        // Your account id: 3
        // Your sudt id: 5
        // ckb balance in godwoken is: 1180000012000
        // waiting for layer 2 block producer collect the deposit cell ... 5 seconds
        // ckb balance in godwoken is: 1180000012000
        // waiting for layer 2 block producer collect the deposit cell ... 10 seconds
        // ckb balance in godwoken is: 1180000012000
        // waiting for layer 2 block producer collect the deposit cell ... 15 seconds
        // ckb balance in godwoken is: 1180000012000
        // waiting for layer 2 block producer collect the deposit cell ... 20 seconds
        // ckb balance in godwoken is: 1180000012000
        // waiting for layer 2 block producer collect the deposit cell ... 25 seconds
        // ckb balance in godwoken is: 1220000012000
        // sudt balance in godwoken is: 480000000000
        // deposit success!


        Ok(0)


        // todo!()
        // Usage: account-cli deposit-sudt [options]
        // deposit sUDT to godwoken
        // Options:
        // 	-p, --private-key <privateKey>               private key to use
        // 	-m --amount <amount>                         sudt amount
        // 	-s --sudt-script-args <l1 sudt script args>  sudt amount
        // 	-r, --rpc <rpc>                              ckb rpc path (default: "http://127.0.0.1:8114")
        // 	-d, --indexer-path <path>                    indexer path (default: "./indexer-data")
        // 	-l, --eth-address <args>                     Eth address (layer2 lock args, using --private-key
        // 																							 value to calculate if not provided)
        // 	-c, --capacity <capacity>                    capacity in shannons (default: "40000000000")
        // 	-h, --help
    }
}
