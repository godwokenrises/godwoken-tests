/// godwoken_cli is built from godwoken-examples/packages/tools
fn godwoken_cli() -> Command {
    let mut godwoken_cli = if cfg!(target_os = "linux") {
        Command::new("./godwoken-cli-linux")
    } else if cfg!(target_os = "macos") {
        Command::new("./godwoken-cli-macos")
    } else {
        panic!("This OS is NOT supported yet.");
    };
    let godwoken_rpc: String =
        env::var("GODWOKEN_RPC").unwrap_or("http://127.0.0.1:8119".to_string());
    let ckb_rpc: String = 
        env::var("CKB_RPC").unwrap_or("http://127.0.0.1:8114".to_string());
    godwoken_cli.args(&["--rpc", &godwoken_rpc])
                .args(&["--ckb-rpc", &ckb_rpc]);
    godwoken_cli
}
