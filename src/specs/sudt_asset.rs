use crate::util::cli::account_cli; // issue_token_cli
use crate::util::get_signers;
// use crate::util::read_data_from_stdout;
use crate::Spec;

/// Simple User-Defined Token
pub struct SudtAsset;

impl Spec for SudtAsset {
    fn run(&self) {
        println!("===============\nSUDT test cases\n===============");

        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());

        let (mut miner, mut user1) = get_signers();

        // println!("* issue new SUDT token");
        // let output = issue_token_cli()
        //     .args(&["--private-key", &miner.private_key])
        //     .args(&["--amount", "1000000000000"])
        //     .args(&["--capacity", "40000000000"])
        //     .output()
        //     .expect("failed to issue token.");
        // // let stdout_text = String::from_utf8(output.stdout).unwrap_or_default();
        // // println!("{}", &stdout_text);
        // // return;
        // miner.sudt_script_args = Some(read_data_from_stdout(
        //     output,
        //     r"sudt script args: (0x[0-9a-fA-F]*)[\n\t\s]",
        //     "sudt script args not found",
        // ));

        // println!("miner's sudt script args: {}", &miner.sudt_script_args.as_ref().unwrap());
        // // FIXME: check the txHash of issuing token: 0x40439edc7be40aadc504504dbb3ce1ed6c7626699dbb701f03dbc35a7b8b61c3
        // let output = issue_token_cli()
        //     .args(&["--private-key", &user1.private_key])
        //     .args(&["--amount", "1000000000000"])
        //     .args(&["--capacity", "40000000000"])
        //     .output()
        //     .expect("failed to issue token.");
        // user1.sudt_script_args = Some(read_data_from_stdout(
        //     output,
        //     r"sudt script args: (0x[0-9a-fA-F]*)[\n\t\s]",
        //     "sudt script args not found",
        // ));
        // println!("user1's sudt script args: {}", &user1.sudt_script_args.as_ref().unwrap());

        // return;
        //TODO: get "sudt-script-args" by private-key

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
        let miner_sudt_balance_record = miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        println!("miner's sudt4 balance: {}", miner_sudt_balance_record);
        let use1_sudt_balance_record = user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        println!("user1's sudt4 balance: {}", use1_sudt_balance_record);

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
            miner_sudt_balance_record - 100000000,
            miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );
        assert_eq!(
            use1_sudt_balance_record + 100000000,
            user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );
    }
}
