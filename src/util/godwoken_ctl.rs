use super::{cli, read_data_from_stdout};
use crate::GodwokenUser;
use cli::godwoken_cli;
use cli::polyjuice_cli;

pub struct GodwokenCtl {
    // godwoken_cli: Command
}

impl Default for GodwokenCtl {
    fn default() -> Self {
        Self::new()
    }
}

impl GodwokenCtl {
    pub fn new() -> Self {
        GodwokenCtl {}
    }

    pub fn get_transaction_receipt(self, l2_tx_hash: &str) -> String {
        let output = godwoken_cli()
            .args(&["getTransactionReceipt", l2_tx_hash])
            .output()
            .expect("failed to get transaction receipt");
        read_data_from_stdout(
            output,
            r"(?s)transaction receipt: (\{.*\})",
            "no transaction receipt",
        )
    }

    // Usage: polyjuice-cli create-creator-account [options]
    // Create account id for create polyjuice contract account (the `creator_account_id` config)
    // Options:
    // -p, --private-key <private key>  your private key to create creator account id
    // -s, --sudt-id <sudt id>          sudt id, default to CKB id (1) (default: "1")
    // -h, --help                       display help for command
    pub fn create_creator_account(self, priv_key: &str, sudt_id: u32) -> String {
        let output = polyjuice_cli()
            .arg("create-creator-account")
            .args(&["--private-key", priv_key])
            .args(&["--sudt-id", &sudt_id.to_string()])
            .output()
            .expect("create-creator-account failed");
        // return creator_account_id
        read_data_from_stdout(
            output,
            r"Your creator account id: (\d+)",
            "no creator_account_id returned",
        )
    }
}

pub struct SimpleStorageContract {
    address: String,
    creator_account_id: String,
}

impl SimpleStorageContract {
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
    pub fn deploy(private_key: &str, creator_account_id: &str, sudt_id: u32) -> Self {
        let output = polyjuice_cli()
            .arg("deploy")
            .args(&["--private-key", private_key])
            .args(&["--creator-account-id", creator_account_id])
            .args(&["--sudt-id", &sudt_id.to_string()])
            .args(&["--gas-limit", "30000"])
            .args(&["--gas-price", "0"])
            // sample-contracts.SimpleStorage
            .args(&["--data", "0x60806040525b607b60006000508190909055505b610018565b60db806100266000396000f3fe60806040526004361060295760003560e01c806360fe47b114602f5780636d4ce63c14605b576029565b60006000fd5b60596004803603602081101560445760006000fd5b81019080803590602001909291905050506084565b005b34801560675760006000fd5b50606e6094565b6040518082815260200191505060405180910390f35b8060006000508190909055505b50565b6000600060005054905060a2565b9056fea2646970667358221220044daf4e34adffc61c3bb9e8f40061731972d32db5b8c2bc975123da9e988c3e64736f6c63430006060033"])
            // .args(&["--value", "0"]) // QUANTITY - (optional) Integer of the value sent with this transaction
            .output().expect("faild to deploy EVM contract");

        let address = read_data_from_stdout(
            output,
            r"contract address: (0x[0-9a-fA-F]*)[\n\t\s]",
            "no contract_address returned",
        );

        SimpleStorageContract {
            address,
            creator_account_id: creator_account_id.to_string(),
        }
    }

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
    pub fn get(&self, from_id: &str) -> String {
        let output = polyjuice_cli()
            .arg("call")
            .args(&["--from-id", from_id])
            .args(&["--to-address", &self.address])
            .args(&["--data", "0x6d4ce63c"])
            .output()
            .expect("faild to call EVM contract");
        read_data_from_stdout(
            output,
            r"return data (0x[0-9a-fA-F]*)[\n\t\s]",
            "no returned data",
        )
    }

    // using eth_sendRawTransaction to send transaction on Godwoken
    // Usage: polyjuice-cli send-transaction [options]
    // Send a transaction to godwoken by `eth_sendRawTransaction`
    // Options:
    // -t, --to-address <eth address>                 to address
    // -l, --gas-limit <gas limit>                    gas limit
    // -p, --gas-price <gas price>                    gas price
    // -d, --data <data>                              The compiled code of a contract OR the hash of the invoked method signature and encoded parameters. For details see Ethereum Contract ABI.
    // -p, --private-key <private key>                private key
    // -c, --creator-account-id <creator account id>  creator account id, default to `3` if ENABLE_TESTNET_MODE=true
    // -v, --value <value>                            value (default: "0")
    // -h, --help                                     display help for command
    pub fn set(&self, signer: &GodwokenUser, num: u32) -> bool {
        let data = format!("0x60fe47b1{:064x}", num);
        let output = polyjuice_cli()
            .arg("send-transaction")
            .args(&["--private-key", &signer.private_key])
            .args(&["--creator-account-id", &self.creator_account_id])
            .args(&["--to-address", &self.address])
            .args(&["--gas-limit", "21000"])
            .args(&["--gas-price", "1"])
            .args(&["--data", &data])
            .output()
            .expect("eth_sendRawTransaction failed");
        let receipt = read_data_from_stdout(
            output,
            r"(?s)transaction receipt: (\{.*\})",
            "no transaction receipt",
        );
        log::debug!("transaction receipt: {}", &receipt);
        !receipt.is_empty()
    }

    /// Get a reference to the simple storage contract's address.
    pub fn address(&self) -> &str {
        self.address.as_str()
    }
}
