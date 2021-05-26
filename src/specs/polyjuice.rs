use crate::{polyjuice_cli, util::get_signers, Spec, CKB_SUDT_ID};

pub struct Polyjuice;

impl Spec for Polyjuice {
    fn run(&self) {
        println!("Polyjuice test cases:");
        let (miner, _user1) = get_signers();

        let mut _status;
        // create-creator-account
        // Usage: polyjuice-cli create-creator-account [options]
        // Create account id for create polyjuice contract account (the `creator_account_id` config)
        // Options:
        // -p, --private-key <private key>  your private key to create creator account id
        // -s, --sudt-id <sudt id>          sudt id, default to CKB id (1) (default: "1")
        // -h, --help                       display help for command
        let creator_account_id = Some(3); //TODO: get creator_account_id by privateKey?
        if creator_account_id.is_none() {
            _status = polyjuice_cli()
                .arg("create-creator-account")
                .args(&["--private-key", &miner.private_key])
                .args(&["--sudt-id", &CKB_SUDT_ID.to_string()])
                .status();
        }

        // miner from id: 4
        // miner creator account id: 3

        // deploy a EVM contract
        // Usage: polyjuice-cli deploy
        // Options:
        // -a, --creator-account-id <creator account id>  creator account id, default to `3` if ENABLE_TESTNET_MODE=true
        // -l, --gas-limit <gas limit>                    gas limit
        // -p, --gas-price <gas price>                    gas price
        // -d, --data <contract data>                     data
        // -p, --private-key <private key>                private key
        // -s, --sudt-id <sudt id>                        sudt id, default to CKB id (1) (default: "1")
        // -v, --value <value>                            value (default: "0")
        // -h, --help                                     display help for command
        _status = polyjuice_cli()
            .arg("deploy")
            .args(&["--private-key", &miner.private_key])
            .args(&[
                "--creator-account-id",
                &creator_account_id.unwrap().to_string(),
            ])
            .args(&["--sudt-id", &CKB_SUDT_ID.to_string()])
            .args(&["--gas-limit", "30000"]) //TODO gas limit?
            .args(&["--gas-price", "1"]) //TODO gas price?
            .args(&["--data", ""])
            .args(&["--value", "1"])
            .status();
        // new script hash: 0x1fff3b2d3c96cb0003b202e76df1c2a8e0ee63c46d8c65a413a26814db7344dc
        // new account id: 5
        // contract address: 0x1fff3b2d3c96cb0003b202e76df1c2a805000000

        // using eth_sendRawTransaction to send transaction on Godwoken
        // Usage: polyjuice-cli send-transaction [options]
        // Send a transaction to godwoken by `eth_sendRawTransaction`
        // Options:
        // -t, --to-address <eth address>                 to address
        // -l, --gas-limit <gas limit>                    gas limit
        // -p, --gas-price <gas price>                    gas price
        // -d, --data <data>                              data
        // -p, --private-key <private key>                private key
        // -c, --creator-account-id <creator account id>  creator account id, default to `3` if ENABLE_TESTNET_MODE=true
        // -v, --value <value>                            value (default: "0")
        // -h, --help                                     display help for command

        // using eth_call to call EVM contract in Polyjuice
        // Usage: polyjuice-cli call [options]
        // Static Call a EVM contract by `eth_call`
        // Options:
        // -t, --from-id <from id>              from id
        // -t, --to-address <contract address>  contract address (default: "0x")
        // -l, --gas-limit <gas limit>          gas limit (default: "16777216")
        // -p, --gas-price <gas price>          gas price (default: "1")
        // -d, --data <data>                    data (default: "0x")
        // -v, --value <value>                  value (default: "0")
        // -h, --help                           display help for command
    }
}
