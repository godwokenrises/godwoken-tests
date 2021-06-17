use crate::util::get_signers;
use crate::Spec;

/// ## Simple User-Defined Token, aka Simple UDT
/// RFC: https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0025-simple-udt/0025-simple-udt.md
pub struct SudtAsset;

impl Spec for SudtAsset {
    fn run(&self) {
        println!("===============\nSUDT Test Cases\n===============");

        let (mut miner, mut user1) = get_signers();

        // deposit sudt from layer1 to layer2 and get gw_account_id, sudt_id and etc.
        log::info!("* miner deposit SUDT from layer1 to layer2");
        if !miner.deposit_sudt(1000000000) {
            log::warn!("[Note] Miner should issue a SUDT first.\n");
            log::info!("* miner issue new SUDT");
            log::info!("miner ckb balance: {:?}", miner.get_balance());
            miner.issue_sudt(66666600001111);

            if !miner.deposit_sudt(1000000000) {
                panic!("Miner deposit SUDT failed.");
            }
        }
        log::info!("* user1 deposit SUDT from layer1 to layer2");
        if !user1.deposit_sudt(222211110000) {
            log::warn!("[Note] User1 should issue a SUDT first.\n");
            log::info!("* user1 issue new SUDT");
            log::info!("user1 ckb balance: {:?}", user1.get_balance());
            user1.issue_sudt(66666600001111);

            if !user1.deposit_sudt(222211110000) {
                panic!("User1 deposit SUDT failed.");
            }
        }

        // get_sudt_balance
        let miner_sudt_balance_record = miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        log::info!(
            "miner's SUDT_{} balance: {}",
            miner.sudt_id.unwrap(),
            miner_sudt_balance_record
        );
        let user1_sudt_balance_record = user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap();
        log::info!(
            "user1's SUDT_{} balance: {}",
            miner.sudt_id.unwrap(),
            user1_sudt_balance_record
        );

        // transfer
        log::info!(
            "* transfer 654321 SUDT_{} from miner to user1",
            miner.sudt_id.unwrap()
        );
        miner.transfer(miner.sudt_id.unwrap(), 654321, user1.gw_account_id.unwrap());
        assert_eq!(
            miner_sudt_balance_record - 654321,
            miner.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );
        assert_eq!(
            user1_sudt_balance_record + 654321,
            user1.get_sudt_balance(miner.sudt_id.unwrap()).unwrap()
        );

        let miner_sudt_balance_record = miner.get_sudt_balance(user1.sudt_id.unwrap()).unwrap();
        let user1_sudt_balance_record = user1.get_sudt_balance(user1.sudt_id.unwrap()).unwrap();
        log::info!(
            "* transfer 54321 SUDT_{} from user1 to miner",
            user1.sudt_id.unwrap()
        );
        user1.transfer(user1.sudt_id.unwrap(), 543210, miner.gw_account_id.unwrap());
        assert_eq!(
            miner_sudt_balance_record + 543210,
            miner.get_sudt_balance(user1.sudt_id.unwrap()).unwrap()
        );
        assert_eq!(
            user1_sudt_balance_record - 543210,
            user1.get_sudt_balance(user1.sudt_id.unwrap()).unwrap()
        );

        // withdraw
        log::info!("wait for asset finalized...");
        std::thread::sleep(std::time::Duration::from_secs(60));
        log::info!(
            "* user1 withdraw 48600000000 SUDT_{} from godwoken",
            user1.sudt_id.unwrap()
        );
        let user1_ckb_balance_record = user1.get_balance().unwrap();
        let l1_sudt_script_hash = user1.l1_sudt_script_hash.clone().unwrap();
        let user1_usdt5_balance_record = user1.get_sudt_balance(user1.sudt_id.unwrap()).unwrap();
        user1.withdraw(&l1_sudt_script_hash, 48600000000, &user1.pub_ckb_addr);
        assert_eq!(
            user1_usdt5_balance_record - 48600000000,
            user1.get_sudt_balance(user1.sudt_id.unwrap()).unwrap()
        );
        assert_eq!(
            // default ckb_shannons_capacity in this withdrawal is 38600000000
            user1_ckb_balance_record - 38600000000,
            user1.get_balance().unwrap()
        );
    }
}
