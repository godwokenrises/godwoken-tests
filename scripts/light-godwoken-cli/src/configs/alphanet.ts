import { Layer1Config, LightGodwokenConfig } from '../../../../light-godwoken/packages/light-godwoken';
import { predefined } from '@ckb-lumos/config-manager';

// Alphanet uses the same layer 1 network as Testnet
const layer1Config: Layer1Config = {
  SCRIPTS: {
    omni_lock: {
      code_hash: "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
      hash_type: "type",
      tx_hash: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
      index: "0x0",
      dep_type: "code",
    },
    secp256k1_blake160: {
      code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      tx_hash: "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
      index: "0x0",
      dep_type: "dep_group",
    },
    sudt: {
      code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hash_type: "type",
      tx_hash: "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
      index: "0x0",
      dep_type: "code",
    },
  },
  CKB_INDEXER_URL: "https://testnet.ckb.dev/indexer",
  CKB_RPC_URL: "https://testnet.ckb.dev",
  SCANNER_URL: "https://pudge.explorer.nervos.org",
};

export const AlphanetConfigV1: LightGodwokenConfig = {
  lumosConfig: predefined.AGGRON4,
  layer1Config: layer1Config,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0x9aa15280cf2123755516ff93180ab14b66a043562ffd70a0947afe7a12d573e5",
        cell_dep: {
          out_point: {
            tx_hash: "0x84c66a1b9ba28d3add646e2aa8415925bc765c888e08edd26e42a27bba421dbc",
            index: "0x0",
          },
          dep_type: "code",
        },
      },
      withdrawal_lock: {
        script_type_hash: "0xb580c581b8789dbd3add6c8d2efc63af3590b1a272d950e7dd1c2f64f5b425b5",
        cell_dep: {
          out_point: {
            tx_hash: "0x1943b90cef80f8b132a13a3fa57814f76584aadec3d5bab5b08c79a9896e7945",
            index: "0x0",
          },
          dep_type: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0x8d6af470fd57d1afe543751eed58afef310ec659d565319f448bcc765176dcdc",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x0a6d3bb9392242c0357fcae7ccead8f87b428ed280909bfdfaa549529b85df38",
      rollup_type_script: {
        code_hash: "0x56abab7961e8348aed629a0e59c05d0f6b555314f8f95606eae4bcb2adafdce3",
        hash_type: "type",
        args: "0x749f79c58129fb18ce425e030e23f127fe60979ef8f69c28a945f4da19fec591",
      },
    },

    GW_POLYJUICE_RPC_URL: "https://gw-alphanet-v1.godwoken.cf",
    SCANNER_URL: "", // might not need this
    SCANNER_API: "", // might not need this
    CHAIN_NAME: "Godwoken Alphanet v1",
    FINALITY_BLOCKS: 100,
    BLOCK_PRODUCE_TIME: 30,
    MIN_CANCEL_DEPOSIT_TIME: 604800, // 7 days in seconds

    MULTICALL_ADDRESS: "", // might not need this
  },
  tokenList: [
    {
      id: 79,
      symbol: "GWK",
      name: "GWK",
      decimals: 8,
      tokenURI: "https://cryptologos.cc/logos/nervos-network-ckb-logo.svg?v=002",
      address: "0x74149D63D8838c0152e45bb8880B320032294d25",
      l1LockArgs: "0x5c7253696786b9eddd34e4f6b6e478ec5742bd36569ec60c1d0487480ba4f9e3",
      layer1UAN: "GWK.ckb",
      layer2UAN: "GWK.gw|gb.ckb",
    },
  ],
};
