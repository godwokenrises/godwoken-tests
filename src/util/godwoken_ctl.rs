use super::{cli, read_data_from_stdout};
use cli::godwoken_cli;

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
}
