use crate::util::cli::get_ontract_script;
use crate::Spec;
use std::env;

pub struct MultiSignWallet;

impl Spec for MultiSignWallet {
    fn run(&self) {
        println!("============================\nMulti-signer Wallet Contract\n============================");
        //TODO: check and set envs including deployer's and singers's privateKey

        log::info!("checking envs...");
        log::info!(
            "GODWOKEN_API={}",
            env::var("GODWOKEN_API").expect("GODWOKEN_API")
        );
        log::info!("WEB3_RPC={}", env::var("WEB3_RPC").expect("WEB3_RPC"));
        env::set_var(
            "DEPLOYER_PRIVATE_KEY",
            env::var("USER2_PRIVATE_KEY").expect("USER2_PRIVATE_KEY"),
        );
        env::set_var(
            "SIGNER_PRIVATE_KEYS",
            format!(
                "{},{}",
                env::var("USER3_PRIVATE_KEY").expect("USER3_PRIVATE_KEY"),
                env::var("USER4_PRIVATE_KEY").expect("USER4_PRIVATE_KEY")
            ),
        );

        // run multi-sign-wallet script
        get_ontract_script("tools/packages/polyjuice/lib/scripts/multi-sign-wallet.js")
            .status()
            .expect("run MultiSignWallet test script");
    }
}
