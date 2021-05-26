use crate::Spec;
use std::env;
use std::process::Command;

pub struct Polyjuice;

impl Spec for Polyjuice {
    fn run(&self) {
        println!("Polyjuice test cases:");

        let _status = polyjuice_cli().arg("--help").status();

        // create-creator-account

        // deploy contract

        // using eth_sendRawTransaction to send transaction on Godwoken

        // using eth_call to call EVM contract in Polyjuice
    }
}

// Usage: polyjuice-cli [options] [command]
// Options:
//   -g, --godwoken-rpc <rpc>          godwoken rpc path, defualt to http://127.0.0.1:8119, default to http://godwoken-testnet-web3-rpc.ckbapp.dev if ENABLE_TESTNET_MODE=true (default: "http://127.0.0.1:8119")
//   -w, --prefix-with-gw              prefix with `gw_` or not, , default to false, default to true if ENABLE_TESTNET_MODE=true (default: false)
//   -h, --help                        display help for command
// Commands:
//   create-creator-account [options]  Create account id for create polyjuice contract account (the `creator_account_id` config)
//   deploy [options]                  Deploy a EVM contract
//   send-transaction [options]        Send a transaction to godwoken by `eth_sendRawTransaction`
//   call [options]                    Static Call a EVM contract by `eth_call`
//   help [command]                    display help for command
fn polyjuice_cli() -> Command {
    let mut polyjuice_cli = if cfg!(target_os = "linux") {
        Command::new("./polyjuice-cli-linux")
    } else if cfg!(target_os = "macos") {
        Command::new("./polyjuice-cli-macos")
    } else {
        panic!("This OS is NOT supported yet.");
    };
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or_else(|_| "http://127.0.0.1:8119".to_string());
    polyjuice_cli.args(&["--godwoken-rpc", &godwoken_rpc]);
    polyjuice_cli
}
