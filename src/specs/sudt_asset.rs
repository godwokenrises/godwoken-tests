use crate::{GodwokenUser, Spec};
use std::env;

/// Simple User-Defined Token
pub struct SudtAsset;
impl Spec for SudtAsset {
    fn run(&self) {
        println!("sUDT test cases:");

        let mut miner = GodwokenUser {
            private_key: env::var("MINER_PRIVATE_KEY").unwrap_or_else(|_| {
                "0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b".to_string()
            }),
            pub_ckb_addr: env::var("MINER_CKB_ADDR")
                .unwrap_or_else(|_| "ckt1qyqy84gfm9ljvqr69p0njfqullx5zy2hr9kq0pd3n5".to_string()),
            ckb_balance: 0,
            account_script_hash: None,
            gw_account_id: None,
            sudt_script_args: env::var("SUDT4_SCRIPT_ARGS").ok(),
        };

        let user1 = GodwokenUser {
            private_key: env::var("USER1_PRIVATE_KEY").unwrap_or_else(|_| {
                "0x6cd5e7be2f6504aa5ae7c0c04178d8f47b7cfc63b71d95d9e6282f5b090431bf".to_string()
            }),
            pub_ckb_addr: env::var("USER1_CKB_ADDR")
                .unwrap_or_else(|_| "ckt1qyqf22qfzaer95xm5d2m5km0f6k288x9warqnhsf4m".to_string()),
            ckb_balance: 0,
            account_script_hash: None,
            gw_account_id: None,
            sudt_script_args: env::var("SUDT5_SCRIPT_ARGS").ok(),
            //TODO: get "sudt-script-args" by private-key
        };

        // deposit sudt from layer1 to layer2
        miner.deposit();

        //TODO get_sudt_balance
        println!("miner's sudt4 balance: {:?}", miner.get_sudt_balance(4));
        // user1.get_sudt_balance(5);

        // withdraw

        // transfer

        // issueToken
    }
}
