use std::env;
use std::process::Command;

/// godwoken_cli is built from godwoken-examples/packages/tools
pub fn node_godwoken_cli() -> Command {
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or_else(|_| "http://127.0.0.1:8119".to_string());
    let ckb_rpc: String =
        env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
    let mut node_godwoken_cli = Command::new("node");
    node_godwoken_cli
        .arg("tools/packages/tools/lib/godwoken-cli.js")
        .args(&["--rpc", &godwoken_rpc])
        .args(&["--ckb-rpc", &ckb_rpc]);
    node_godwoken_cli
}

/// account_cli is built from godwoken-examples/packages/tools
pub fn account_cli() -> Command {
    let mut account_cli = if cfg!(target_os = "linux") {
        Command::new("./account-cli-linux")
    } else if cfg!(target_os = "macos") {
        Command::new("./account-cli-macos")
    } else {
        panic!("This OS is NOT supported yet.");
    };
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or_else(|_| "http://127.0.0.1:8119".to_string());
    let lumos_config_file_path: String =
        env::var("LUMOS_CONFIG_FILE").unwrap_or_else(|_| "configs/lumos-config.json".to_string());
    account_cli
        .env("LUMOS_CONFIG_FILE", &lumos_config_file_path)
        .args(&["--godwoken-rpc", &godwoken_rpc]);
    account_cli
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
/// polyjuice_cli is built from godwoken-examples/packages/tools
pub fn polyjuice_cli() -> Command {
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
