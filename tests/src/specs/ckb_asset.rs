use std::process::{Command};
use crate::{Spec};
use std::env;
use regex::Regex;
//TODO: https://docs.rs/env_logger/0.8.3/env_logger/ 
//TODO: Redirect both stdout and stderr of child process to the same file

pub const CKB_SUDT_ACCOUNT_ID: u32 = 1;

pub struct GodwokenUser {
	private_key: String,
	pub_ckb_addr: String,
	gw_account_id: u32,
	ckb_balance: u128,
	// account_script_hash: H256
	//TODO: sudt_balance[]
}

impl GodwokenUser {
	fn get_balance(&mut self) -> u128{
		// FIXME: get gw_account_id
		let pattern: Regex = Regex::new(r"[B|b]alance: (\d+)").unwrap();
		let mut balance_output = account_cli()
		  .args(&["get-balance", &self.gw_account_id.to_string()])
			.output()
			.expect("failed to get-balance");
		let output_text = String::from_utf8(balance_output.stdout)
			.unwrap_or("".to_string());
		let balance_str = if let Some(cap) = pattern.captures(&output_text) {
			if cap.len() > 1 { cap.get(1).unwrap().as_str() } else { "0" }
		} else { panic!("can't get balance.") };
		self.ckb_balance = u128::from_str_radix(balance_str, 10).unwrap();
		self.ckb_balance		
	}
}

pub struct CkbAsset;

impl Spec for CkbAsset {
	/// Case: 
	/// 	1. deposit CKB from layer1 to layer2
	///		2. godwoken transfer from MINER to USER1
	///   3. withdraw CKB from layer2 to layer1
	fn run(&self) {
		// call account-cli
		println!("\nCkbAsset Test Case: invoke account-cli to deposit -> transfer -> withdraw");

		let ckb_rpc: String = env::var("CKB_RPC")
			.unwrap_or("http://127.0.0.1:8114".to_string());

		let mut miner = GodwokenUser {
			private_key: env::var("MINER_PRIVATE_KEY")
				.unwrap_or("0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b".to_string()),
			pub_ckb_addr: env::var("MINER_CKB_ADDR")
				.unwrap_or("ckt1qyqy84gfm9ljvqr69p0njfqullx5zy2hr9kq0pd3n5".to_string()),
			ckb_balance: 0,
			gw_account_id: 2 // FIXME: get account_id
		};
		let mut user1 = GodwokenUser {
			private_key: env::var("USER1_PRIVATE_KEY")
				.unwrap_or("0x6cd5e7be2f6504aa5ae7c0c04178d8f47b7cfc63b71d95d9e6282f5b090431bf".to_string()),
			pub_ckb_addr: env::var("USER1_CKB_ADDR")
				.unwrap_or("ckt1qyqf22qfzaer95xm5d2m5km0f6k288x9warqnhsf4m".to_string()),
			ckb_balance: 0,
			gw_account_id: 3 // FIXME: get account_id
		};

		//TODO: getAccountIdByScriptHash
		// using eth address: 0x0c1efcca2bcb65a532274f3ef24c044ef4ab6d73
		// rollupTypeHash: 0xf70aa98a96fba847185be1b58c1d1e3cae7ad91f971eecc5749799d5e72939f0
		// Layer 2 lock script hash: 0xfe4fd59fb87ee629a81f0f1120cd0be244bf39860559ccfb65c1379bf9942941
		// ↑ Using this script hash to get user account id ↑
// 		gw-cli --help                            ─╯
// Usage: godwoken-cli [options] [command]

// Options:
//   -r, --rpc <rpc>                                                                                Godwoken jsonrpc url (default: "http://127.0.0.1:8119")
//   -s, --ckb-rpc <ckbRpc>                                                                         CKB node jsonrpc url (default: "http://127.0.0.1:8114")
//   -h, --help                                                                                     display help for command

// Commands:
//   getNonce <account_id>                                                                          Get nonce from account
//   getBalance <sudt_id> <account_id>                                                              Get balance from account
//   generateTransactionMessageToSign <from_id> <to_id> <nonce> <args> <rollup_type_hash>           Generate the raw layer 2 transaction message to sign
//   createAccountRawL2Transaction <from_id> <nonce> <script_code_hash> <script_args>               Create raw layer 2 transaction for layer 2 creator account (to_id)
//   createAccount <from_id> <nonce> <script_code_hash> <script_args> <rollup_type_hash> <privkey>  Create an account by target script
//   executeL2Transaction <from_id> <to_id> <nonce> <args> <signature>                              Submit the layer 2 transaction
//   submitL2Transaction <from_id> <to_id> <nonce> <args> <signature>                               Submit the layer 2 transaction
//   signMessage <message> <privkey>                                                                Sign the message use secp256k1
//   getAccountIdByScriptHash <script_hash>                                                         Get account id by script hash
//   getScriptHash <account_id>                                                                     Get script hash by account id
//   getScript <script_hash>                                                                        Get script by script hash
//   deposite <privkey> <amount>                                                                    Deposite some value [TODO]
//   unlockWithdraw <privkey> <runner_config>                                                       Unlock one finalized withdrawal locked cell (NOTE: need lumos-config path)
//   help [command]                                                                                 display help for command


		let mut miner_balance_record = miner.get_balance();
		let mut user1_balance_record = user1.get_balance();
		println!("miner_balance_record: {}", miner_balance_record);
		println!("user1_balance_record: {}", user1_balance_record);

		return;

		let _exit_status: std::process::ExitStatus = account_cli()
			.arg("deposit")
			.args(&["--rpc", &ckb_rpc])
			.args(&["-p", &miner.private_key])
			.args(&["-c", "60000000000"]) // 600 CKBytes = 60,000,000,000 Shannons
			.status()
			.expect("failed to deposit CKB from layer1 to layer2");
		//TODO: if _exit_status.status.success()


		// transfer
		println!("\nTransfer 10001 Shannons from ID:2 to ID:3");
		let _transfer_status = account_cli()
			.arg("transfer")
			.args(&["--rpc", &ckb_rpc])
			.args(&["-p", &miner.private_key])
			.args(&["--amount", "10000000001"])
			.args(&["--fee", "100"])
  		.args(&["--to-id", "3"])
			.args(&["--sudt-id", "1"])
			.status()
			.expect("failed to transfer");

		// withdraw
		println!("\nAccount ID: 2 withdraw 40000000000 shannons CKB from godwoken");
		let mut _withdrawal_status = account_cli().arg("withdraw")
			.args(&["--rpc", &ckb_rpc])
		  .args(&["-p", &miner.private_key])
			.args(&["--owner-ckb-address", "ckt1qyqy84gfm9ljvqr69p0njfqullx5zy2hr9kq0pd3n5"])
			.args(&["--capacity", "40000000000"]) // 40,000,000,000 Shannons = 400 CKBytes
			.status();
		println!("\nAccount ID: 3 withdraw 10000 shannons CKB from godwoken");
			_withdrawal_status = account_cli().arg("withdraw")
			.args(&["--rpc", &ckb_rpc])
		  .args(&["-p", &user1.private_key])
			.args(&["--owner-ckb-address", "ckt1qyqf22qfzaer95xm5d2m5km0f6k288x9warqnhsf4m"])
			.args(&["--capacity", "10000000000"])
			.status();

		// query balance after confirm
		// println!("\nAccount ID: 2");
		// _get_balance_status = account_cli()
		//   .args(&["get-balance", "2"])
		// 	.status()
		// 	.expect("failed to get-balance");
		// println!("\nAccount ID: 3");
		// _get_balance_status = account_cli()
		//   .args(&["get-balance", "3"])
		// 	.status()
		// 	.expect("failed to get-balance");

			// TODO: assert_eq!
			// id2 += 20000000000 - 100000001
			// id3 += 1
	}
}

/// account_cli is built from godwoken-examples/packages/tools
fn account_cli() -> Command {
	let mut account_cli = if cfg!(target_os = "linux") {
		Command::new("./account-cli-linux")
	} else if cfg!(target_os = "macos"){
		Command::new("./account-cli-macos")
	} else {
		panic!("This OS is NOT supported yet.");
	};
	let godwoken_rpc: String = env::var("GODWOKEN_RPC")
		.unwrap_or("http://127.0.0.1:8119".to_string());
	let lumos_config_file_path: String = env::var("LUMOS_CONFIG_FILE")
		.unwrap_or("configs/lumos-config.json".to_string());
	account_cli
		.env("LUMOS_CONFIG_FILE", &lumos_config_file_path)
		.args(&["--godwoken-rpc", &godwoken_rpc]);
	account_cli
}

/// godwoken_cli is built from godwoken-examples/packages/tools
fn godwoken_cli() -> Command {
	let mut godwoken_cli = if cfg!(target_os = "linux") {
		Command::new("./godwoken-cli-linux")
	} else if cfg!(target_os = "macos") {
		Command::new("./godwoken-cli-macos")
	} else {
		panic!("This OS is NOT supported yet.");
	};
	let godwoken_rpc: String = env::var("GODWOKEN_RPC")
		.unwrap_or("http://127.0.0.1:8119".to_string());
	let ckb_rpc: String = env::var("CKB_RPC")
		.unwrap_or("http://127.0.0.1:8114".to_string());
	godwoken_cli
		.args(&["--rpc", &godwoken_rpc])
		.args(&["--ckb-rpc", &ckb_rpc]);
	godwoken_cli
}
