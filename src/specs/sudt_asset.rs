use crate::util::cli::account_cli;
use crate::util::godwoken_ctl::GodwokenCtl;
use crate::util::{get_signers, read_data_from_stdout};
use crate::Spec;

/// ## Simple User-Defined Token, aka Simple UDT
/// RFC: https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0025-simple-udt/0025-simple-udt.md
pub struct SudtAsset;

impl Spec for SudtAsset {
    fn run(&self) {
        println!("===============\nSUDT test cases\n===============");

        let ckb_rpc: String =
            std::env::var("CKB_RPC").unwrap_or_else(|_| "http://127.0.0.1:8114".to_string());

        let (mut miner, mut user1) = get_signers();

        // deposit sudt from layer1 to layer2 and get gw_account_id, sudt_id and etc.
        println!("* miner deposit sudt from layer1 to layer2");
        if !miner.deposit_sudt(1000000000) {
            // FIXME: Sometimes TypeError: Cannot read property 'tx_status' of null
            // at Object.waitTxCommitted (/godwoken-tests/tools/packages/tools/lib/account/common.js:34:37)
            // at async Command.run (/godwoken-tests/tools/packages/tools/lib/account/deposit-sudt.js:73:9)

            println!("\n[Note] Miner should issue a SUDT first.\n");
            println!("* miner issue new SUDT");
            miner.issue_sudt(10000000000);

            if !miner.deposit_sudt(1000000000) {
                panic!("Miner's deposit failed.");
            }
        }
        println!("* user1 deposit sudt from layer1 to layer2");
        if !user1.deposit_sudt(1000000000) {
            println!("\n[Note] User1 should issue a SUDT first.\n");
            println!("* user1 issue new SUDT");
            user1.issue_sudt(10000000000);

            if !user1.deposit_sudt(1000000000) {
                panic!("User1's deposit failed.");
            }
        }

        // get_sudt_balance
        let miner_sudt_balance_record = miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        println!("miner's sudt4 balance: {}", miner_sudt_balance_record);
        let use1_sudt_balance_record = user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        println!("user1's sudt4 balance: {}", use1_sudt_balance_record);

        // transfer
        println!("* Transfer 654321 sUDT from miner to user1");
        let output = account_cli()
            .arg("transfer")
            .args(&["--rpc", &ckb_rpc])
            .args(&["-p", &miner.private_key])
            .args(&["--amount", "654321"])
            .args(&["--fee", "0"])
            .args(&["--to-id", &user1.gw_account_id.unwrap().to_string()])
            .args(&["--sudt-id", &miner.sudt_id.unwrap().to_string()])
            .output()
            .expect("failed to transfer");
        let l2_tx_hash = read_data_from_stdout(
            output,
            r"l2 tx hash: (0x[0-9a-fA-F]*)[\n\t\s]",
            "no l2_tx_hash returned.",
        );
        log::debug!("layer2 transaction hash: {}", &l2_tx_hash);
        print!("{}", GodwokenCtl::get_transaction_receipt(&l2_tx_hash));
        assert_eq!(
            miner_sudt_balance_record - 654321,
            miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );
        assert_eq!(
            use1_sudt_balance_record + 654321,
            user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );

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
        println!("* user1 withdraw 60000000 SUDT5 from godwoken");
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
    }
}
