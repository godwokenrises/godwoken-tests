use serde::{Deserialize, Serialize};

/// The 32-byte fixed-length binary data, Represent 256 bits
///
/// The name comes from the number of bits in the data.
///
/// In JSONRPC, it is encoded as a 0x-prefixed hex string.
#[derive(Eq, PartialEq, Debug, Default, Hash, Clone, Copy)]
pub struct H256([u8; 32]);
// pub struct H256(pub [u8; 32]);

#[allow(dead_code)]
type Address = [u8; 20];
// TODO: △ user these types

pub const CKB_SUDT_ID: u32 = 1;
pub const CKB_SUDT_SCRIPT_HASH: &str =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
pub const X_SUDT_ID: u32 = 2;

#[derive(Clone, Default, Debug, PartialEq, Serialize, Deserialize)]
pub struct Config {
    pub genesis: GenesisConfig,
}

#[derive(Clone, Default, Debug, PartialEq, Serialize, Deserialize)]
pub struct GenesisConfig {
    pub rollup_config: RollupConfig,
}

#[derive(Clone, Default, Debug, PartialEq, Serialize, Deserialize)]
pub struct RollupConfig {
    pub finality_blocks: String,
}
