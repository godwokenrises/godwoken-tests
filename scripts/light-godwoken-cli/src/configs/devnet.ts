import { Layer1Config, LightGodwokenConfig } from '../../../../light-godwoken/packages/light-godwoken';
import { createConfig } from '@ckb-lumos/config-manager';

const lumosConfig = createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    SECP256K1_BLAKE160: {
      CODE_HASH: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      HASH_TYPE: "type",
      TX_HASH: "0xd0726898772092537cec0b12953b36bc7d41cb6bcb7c8449c044fc0c08adb0fb",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
      SHORT_ID: 0
    },
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      HASH_TYPE: "type",
      TX_HASH: "0xd0726898772092537cec0b12953b36bc7d41cb6bcb7c8449c044fc0c08adb0fb",
      INDEX: "0x1",
      DEP_TYPE: "dep_group",
      SHORT_ID: 1
    },
    DAO: {
      CODE_HASH: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      HASH_TYPE: "type",
      TX_HASH: "0x2b397667654f3bc1fcb3efc7db0fd2799eaef962b7920840f3f4c7b467be5487",
      INDEX: "0x2",
      DEP_TYPE: "code"
    },
    SUDT: {
      CODE_HASH: "0x6283a479a3cf5d4276cd93594de9f1827ab9b55c7b05b3d28e4c2e0a696cfefd",
      HASH_TYPE: "type",
      TX_HASH: "0x2b397667654f3bc1fcb3efc7db0fd2799eaef962b7920840f3f4c7b467be5487",
      INDEX: "0x5",
      DEP_TYPE: "code"
    },
    ANYONE_CAN_PAY: { // TODO: have no way finding it in devnet
      CODE_HASH: "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356",
      HASH_TYPE: "type",
      TX_HASH: "0xec26b0f85ed839ece5f11c4c4e837ec359f5adc4420410f6453b1f6b60fb96a6",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
      SHORT_ID: 2
    }
  }
});

const layer1Config: Layer1Config = {
  SCRIPTS: {
    omni_lock: {
      code_hash: "0x8adcbae4e6f4fc21977c328965d4740cb9de91b4277920a17839aeefe9e2795a",
      hash_type: "type",
      tx_hash: "0x09a7df80bdc2f6112196335a2e464ade626da68dc81f6418e2daee145380a36f",
      index: "0x0",
      dep_type: "code",
    },
    secp256k1_blake160: { // outputs[1] in genesis block
      code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      tx_hash: "0xd0726898772092537cec0b12953b36bc7d41cb6bcb7c8449c044fc0c08adb0fb",
      index: "0x0",
      dep_type: "dep_group",
    },
    sudt: {
      code_hash: "0x6283a479a3cf5d4276cd93594de9f1827ab9b55c7b05b3d28e4c2e0a696cfefd",
      hash_type: "type",
      tx_hash: "0x2b397667654f3bc1fcb3efc7db0fd2799eaef962b7920840f3f4c7b467be5487",
      index: "0x5",
      dep_type: "code",
    },
  },
  CKB_INDEXER_URL: "http://127.0.0.1:8116",
  CKB_RPC_URL: "http://127.0.0.1:8114",
  SCANNER_URL: "",
};

export const devnetConfigV1: LightGodwokenConfig = {
  lumosConfig: lumosConfig,
  layer1Config: layer1Config,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0xcf0bcea51b7478f06581743efa64bd706ce5f87424e430ed6ab5e681c62fb0fa",
        cell_dep: {
          out_point: {
            tx_hash: "0x9b9fc90f8f1ea639a39a448de1c058e9f1564259fa88da14d49dac8d84211685",
            index: "0x0",
          },
          dep_type: "code",
        },
      },
      withdrawal_lock: {
        script_type_hash: "0x5722b1fa3d8ba814a9a59bcc05bdbd539f28569b4a2fb446ac08828911947542",
        cell_dep: {
          out_point: {
            tx_hash: "0xd264f9ae4f2ca010b21f95d7bacee06c726e4c3023931dea672bf26500105bbb",
            index: "0x0",
          },
          dep_type: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0x1d0dffb09055040adbc9f3e59be09c7a6e72d279d7e0bca89d02ef9f41021cc8",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x80873d0200c6150783b3bb43a3c5e3886c08502f564827b077c1246d697a5be3",
      rollup_type_script: {
        code_hash: "0x173eac817872c19a51470a47084108226beeace276212057ff962a37a4512dc6",
        hash_type: "type",
        args: "0x069c1b95b57442ed99ddf6d6634a0e72c2bb4383e42c0c58e1a9fe13c712133b",
      },
    },

    GW_POLYJUICE_RPC_URL: "http://127.0.0.1:8024",
    SCANNER_URL: "", // might not need this
    SCANNER_API: "", // might not need this
    CHAIN_NAME: "Godwoken Devnet v1",
    FINALITY_BLOCKS: 100,
    BLOCK_PRODUCE_TIME: 30,
    MIN_CANCEL_DEPOSIT_TIME: 604800, // 7 days in seconds

    MULTICALL_ADDRESS: "", // might not need this
  },
};
