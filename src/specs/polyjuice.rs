use crate::util::godwoken_ctl::{GodwokenCtl, SimpleStorageContract};
use crate::{util::get_signers, Spec, CKB_SUDT_ID};
use std::time::{SystemTime, UNIX_EPOCH};

pub struct Polyjuice;

impl Spec for Polyjuice {
    fn run(&self) {
        println!("====================\nPolyjuice Test Cases\n====================");

        let (miner, mut user1) = get_signers();
        let godwoken_ctl = GodwokenCtl::new();

        log::info!("* create-creator-account and get creator_account_id");
        let creator_account_id =
            godwoken_ctl.create_creator_account(&user1.private_key, CKB_SUDT_ID);
        log::info!("Polyjuice creator account id: {}", &creator_account_id);

        log::info!("* deploy an EVM contract - SimpleStorage");
        let contract =
            SimpleStorageContract::deploy(&miner.private_key, &creator_account_id, CKB_SUDT_ID);
        log::info!("contract address: {}", contract.address());

        // get from_id, aka account id
        let from_id = user1.get_account_id().unwrap().to_string();

        log::info!("* call EVM contract in Polyjuice using eth_call: SimpleStorage.get() ->");
        let mut stored_data = contract.get(&from_id);
        log::info!("storedData = {}", &stored_data);
        assert_eq!(
            stored_data,
            "0x000000000000000000000000000000000000000000000000000000000000007b"
        );

        let rand = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .subsec_nanos();
        log::info!("* SimpleStorage.set({}) ->", rand);
        contract.set(&user1, rand);

        log::info!("* SimpleStorage.get() ->");
        stored_data = contract.get(&from_id);
        log::info!("storedData = {}", &stored_data);
        assert_eq!(stored_data, format!("{:#066x}", rand));
    }
}
