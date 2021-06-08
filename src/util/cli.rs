use std::env;
use std::process::Command;

/// godwoken_cli is built from godwoken-examples/packages/tools
pub fn godwoken_cli() -> Command {
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or_else(|_| "http://127.0.0.1:8119".to_string());
    let ckb_rpc: String =
        env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
    let mut _cli = Command::new("node");
    _cli.arg("tools/packages/tools/lib/godwoken-cli.js")
        .args(&["--rpc", &godwoken_rpc])
        .args(&["--ckb-rpc", &ckb_rpc]);
    _cli
}

// Usage: issue-token [options]
// Options:
//   -V, --version                   output the version number
//   -p, --private-key <privateKey>  private key to use
//   -m --amount <amount>            sudt amount
//   -r, --rpc <rpc>                 rpc path (default: "http://127.0.0.1:8114")
//   -d, --indexer-path <path>       indexer path (default: "./indexer-data")
//   -c, --capacity <capacity>       capacity in issued cell
//   -h, --help                      display help for command
/// issue a new sudt token
pub fn issue_token_cli() -> Command {
    let lumos_config_file_path: String =
        env::var("LUMOS_CONFIG_FILE").unwrap_or_else(|_| "configs/lumos-config.json".to_string());
    let ckb_rpc: String =
        env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());
    let mut _cli = Command::new("node");
    _cli.env("LUMOS_CONFIG_FILE", &lumos_config_file_path)
        .arg("tools/packages/tools/lib/issue-token.js")
        .args(&["--rpc", &ckb_rpc]);
    _cli
}

/// account_cli is built from godwoken-examples/packages/tools
pub fn account_cli() -> Command {
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or_else(|_| "http://127.0.0.1:8119".to_string());
    let lumos_config_file_path: String =
        env::var("LUMOS_CONFIG_FILE").unwrap_or_else(|_| "configs/lumos-config.json".to_string());
    let mut _cli = Command::new("node");
    _cli.env("LUMOS_CONFIG_FILE", &lumos_config_file_path)
        .arg("tools/packages/tools/lib/account-cli.js")
        .args(&["--godwoken-rpc", &godwoken_rpc]);
    _cli
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
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or_else(|_| "http://127.0.0.1:8119".to_string());
    let mut _cli = Command::new("node");
    _cli.arg("tools/packages/tools/lib/polyjuice-cli.js")
        .args(&["--godwoken-rpc", &godwoken_rpc]);
    _cli
}
