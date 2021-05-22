pub mod specs;
pub use specs::Spec;
pub mod worker;

/// The 32-byte fixed-length binary data, Represent 256 bits
///
/// The name comes from the number of bits in the data.
///
/// In JSONRPC, it is encoded as a 0x-prefixed hex string.
#[derive(Eq, PartialEq, Debug, Default, Hash, Clone, Copy)]
pub struct H256([u8; 32]);
// pub struct H256(pub [u8; 32]);
