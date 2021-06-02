use crate::types::{CKB_SUDT_ID, CKB_SUDT_SCRIPT_HASH};
use crate::Spec;

pub struct CkbAsset;
impl Spec for CkbAsset {
    /// Case:
    ///   1. deposit CKB from layer1 to layer2
    ///   2. godwoken transfer from MINER to USER1
    ///   3. withdraw CKB from layer2 to layer1
    fn run(&self) {
        println!("==================\nCkbAsset Test Case\n==================");

        let (mut miner, mut user1) = crate::util::get_signers();

        log::info!("* deposit CKB");
        miner.deposit_ckb(60000000000);
        user1.deposit_ckb(30000000000);

        let miner_balance_record = miner.get_balance().unwrap();
        log::info!("miner_balance_record: {}", miner_balance_record);
        assert_eq!(miner.ckb_balance, miner_balance_record);
        let user1_balance_record = user1.get_balance().unwrap();
        log::info!("user1_balance_record: {}", user1_balance_record);
        assert_eq!(user1.ckb_balance, user1_balance_record);

        log::info!("* Transfer 111 Shannons (CKB) from miner to user1");
        miner.transfer(CKB_SUDT_ID, 111, user1.gw_account_id.unwrap());
        log::info!("miner_balance_record: {:?}", miner.get_balance());
        log::info!("user1_balance_record: {:?}", user1.get_balance());
        assert_eq!(miner.ckb_balance, miner_balance_record - 111);
        assert_eq!(user1.ckb_balance, user1_balance_record + 111);

        // withdraw
        let miner_balance_record = miner.ckb_balance;
        let user1_balance_record = user1.ckb_balance;

        log::info!("* miner withdraw 40000000000 shannons (CKB) from godwoken");
        miner.withdraw(CKB_SUDT_SCRIPT_HASH, 40000000000, &miner.pub_ckb_addr);

        log::info!("* user1 withdraw 10000000000 shannons (CKB) from godwoken");
        user1.withdraw(CKB_SUDT_SCRIPT_HASH, 10000000000, &user1.pub_ckb_addr);

        log::info!("miner_balance_record: {:?}", miner.get_balance());
        log::info!("user1_balance_record: {:?}", user1.get_balance());
        assert_eq!(miner.ckb_balance, miner_balance_record - 40000000000);
        assert_eq!(user1.ckb_balance, user1_balance_record - 10000000000);
    }
}
