use crate::util::cli::{node_godwoken_cli, polyjuice_cli};
use crate::{util::get_signers, Spec, CKB_SUDT_ID};
use regex::Regex;

pub struct Polyjuice;

impl Spec for Polyjuice {
    fn run(&self) {
        println!("====================\nPolyjuice test cases\n====================");

        let (_miner, user1) = get_signers();

        println!("* create-creator-account and get creator_account_id");
        // Usage: polyjuice-cli create-creator-account [options]
        // Create account id for create polyjuice contract account (the `creator_account_id` config)
        // Options:
        // -p, --private-key <private key>  your private key to create creator account id
        // -s, --sudt-id <sudt id>          sudt id, default to CKB id (1) (default: "1")
        // -h, --help                       display help for command
        let output = polyjuice_cli()
            .arg("create-creator-account")
            .args(&["--private-key", &user1.private_key])
            .args(&["--sudt-id", &CKB_SUDT_ID.to_string()])
            .output()
            .expect("create-creator-account failed.");
        let stdout_text = String::from_utf8(output.stdout).unwrap_or_default();
        let pattern = Regex::new(r"Your creator account id: (\d+)").unwrap();
        let creator_account_id = if let Some(cap) = pattern.captures(&stdout_text) {
            cap.get(1).unwrap().as_str()
        } else {
            panic!(
                "no creator_account_id returned.\n{}\n{}",
                &String::from_utf8(output.stderr).unwrap_or_default(),
                &stdout_text
            );
        };
        println!("Polyjuice creator account id: {}", creator_account_id);

        println!("* deploy an EVM contract - SimpleStorage");
        // Usage: polyjuice-cli deploy
        // Options:
        // -a, --creator-account-id <creator account id>  creator account id, default to `3` if ENABLE_TESTNET_MODE=true
        // -l, --gas-limit <gas limit>                    gas limit
        // -p, --gas-price <gas price>                    gas price
        // -d, --data <contract data>                     contract bin data, should be HexString
        // -p, --private-key <private key>                private key
        // -s, --sudt-id <sudt id>                        sudt id, default to CKB id (1) (default: "1")
        // -v, --value <value>                            value (default: "0")
        // -h, --help                                     display help for command
        let output = polyjuice_cli()
            .arg("deploy")
            .args(&["--private-key", &_miner.private_key])
            .args(&["--creator-account-id", creator_account_id])
            .args(&["--sudt-id", &CKB_SUDT_ID.to_string()])
            .args(&["--gas-limit", "30000"])
            .args(&["--gas-price", "0"])
            // sample-contracts.SimpleStorage
            .args(&["--data", "0x60806040525b607b60006000508190909055505b610018565b60db806100266000396000f3fe60806040526004361060295760003560e01c806360fe47b114602f5780636d4ce63c14605b576029565b60006000fd5b60596004803603602081101560445760006000fd5b81019080803590602001909291905050506084565b005b34801560675760006000fd5b50606e6094565b6040518082815260200191505060405180910390f35b8060006000508190909055505b50565b6000600060005054905060a2565b9056fea2646970667358221220044daf4e34adffc61c3bb9e8f40061731972d32db5b8c2bc975123da9e988c3e64736f6c63430006060033"])
            // .args(&["--value", "0"]) // QUANTITY - (optional) Integer of the value sent with this transaction
            .output().expect("faild to deploy EVM contract.");
        let stdout_text = String::from_utf8(output.stdout).unwrap_or_default();
        let pattern = Regex::new(r"contract address: (0x[0-9a-fA-F]*)[\n\t\s]").unwrap();
        let contract_address = if let Some(cap) = pattern.captures(&stdout_text) {
            cap.get(1).unwrap().as_str()
        } else {
            panic!(
                "no contract_address returned.\n{}\n{}",
                &String::from_utf8(output.stderr).unwrap_or_default(),
                &stdout_text
            );
        };
        println!("contract address: {}", contract_address);

        // get from_id, aka account id
        let output = node_godwoken_cli()
            .args(&["getAccountId", &user1.private_key])
            .output()
            .expect("failed to get account ID.");
        let stdout_text = String::from_utf8(output.stdout).unwrap_or_default();
        let pattern = Regex::new(r"Account id: (\d+)").unwrap();
        let from_id = if let Some(cap) = pattern.captures(&stdout_text) {
            cap.get(1).unwrap().as_str()
        } else {
            panic!(
                "no account id returned.\n{}\n{}",
                &String::from_utf8(output.stderr).unwrap_or_default(),
                &stdout_text
            );
        };
        // println!("from id of user1: {}", from_id);

        //TODO
        println!("* call EVM contract in Polyjuice using eth_call: SimpleStorage.get() ->");
        // Usage: polyjuice-cli call [options]
        // Static Call a EVM contract by `eth_call`
        // Options:
        // -t, --from-id <from id>              from id
        // -t, --to-address <contract address>  contract address (default: "0x")
        // -l, --gas-limit <gas limit>          gas limit (default: "16777216")
        // -p, --gas-price <gas price>          gas price (default: "1")
        // -d, --data <data>                    data (default: "0x") - Hash of the method signature and encoded parameters. For details see Etherepum Contract ABI
        // -v, --value <value>                  (optional, default: "0") Integer of the value sent with this
        // -h, --help                           display help for command
        let output = polyjuice_cli()
            .arg("call")
            .args(&["--from-id", from_id])
            .args(&["--to-address", contract_address])
            .args(&["--data", "0x6d4ce63c"])
            .output()
            .expect("faild to call EVM contract");
        let mut stored_data = read_data_from_stdout(
            output,
            r"return data (0x[0-9a-fA-F]*)[\n\t\s]",
            "no returned data",
        );
        println!("storedData = {}", &stored_data);

        println!("* SimpleStorage.set(0x011) ->");
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
        let _output = polyjuice_cli()
            .arg("send-transaction")
            .args(&["--private-key", &user1.private_key])
            .args(&["--creator-account-id", creator_account_id])
            .args(&["--to-address", contract_address])
            .args(&["--gas-limit", "21000"])
            .args(&["--gas-price", "1"])
            .args(&[
                "--data",
                "0x60fe47b10000000000000000000000000000000000000000000000000000000000000011",
            ])
            .status()
            .expect("faild to call EVM contract");

        println!("* SimpleStorage.get() ->");
        let output = polyjuice_cli()
            .arg("call")
            .args(&["--from-id", from_id])
            .args(&["--to-address", contract_address])
            .args(&["--data", "0x6d4ce63c"])
            .output()
            .expect("faild to call EVM contract");
        stored_data = read_data_from_stdout(
            output,
            r"return data (0x[0-9a-fA-F]*)[\n\t\s]",
            "no returned data",
        );
        println!("storedData = {}", &stored_data);
    }
}

fn read_data_from_stdout(output: std::process::Output, regex: &str, err_msg: &str) -> String {
    let stdout_text = String::from_utf8(output.stdout).unwrap_or_default();
    let pattern = Regex::new(regex).unwrap();
    let data = if let Some(cap) = pattern.captures(&stdout_text) {
        cap.get(1).unwrap().as_str().to_owned()
    } else {
        panic!(
            "{}\n{}\n{}",
            err_msg,
            &String::from_utf8(output.stderr).unwrap_or_default(),
            &stdout_text
        );
    };
    data
}
