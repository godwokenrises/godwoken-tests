import { Layer1Config, LightGodwokenConfig } from '../../../../light-godwoken/packages/light-godwoken';
import { createConfig, ScriptConfig } from '@ckb-lumos/config-manager';
import { CellDep, DepType, HashType, Script } from '@ckb-lumos/base';
import DevnetDeps from '../config-deps/devnet.json';

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
      CODE_HASH: DevnetDeps.scripts.l1Sudt.typeHash,
      HASH_TYPE: DevnetDeps.scripts.l1Sudt.typeScript.hash_type as ScriptConfig['HASH_TYPE'],
      TX_HASH: DevnetDeps.scripts.l1Sudt.cellDep.out_point.tx_hash,
      INDEX: DevnetDeps.scripts.l1Sudt.cellDep.out_point.index,
      DEP_TYPE: DevnetDeps.scripts.l1Sudt.cellDep.dep_type as ScriptConfig['DEP_TYPE'],
    },
    ANYONE_CAN_PAY: { // TODO: haven't found a way to fill this for devnet
      CODE_HASH: "0x0000000000000000000000000000000000000000000000000000000000000000",
      HASH_TYPE: "type",
      TX_HASH: "0x0000000000000000000000000000000000000000000000000000000000000000",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
      SHORT_ID: 2
    }
  }
});

const layer1Config: Layer1Config = {
  SCRIPTS: {
    omni_lock: {
      code_hash: DevnetDeps.scripts.omniLock.typeHash,
      hash_type: DevnetDeps.scripts.omniLock.typeScript.hash_type as HashType,
      tx_hash: DevnetDeps.scripts.omniLock.cellDep.out_point.tx_hash,
      index: DevnetDeps.scripts.omniLock.cellDep.out_point.index,
      dep_type: DevnetDeps.scripts.omniLock.cellDep.dep_type as DepType,
    },
    secp256k1_blake160: { // outputs[1] in genesis block
      code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      tx_hash: "0xd0726898772092537cec0b12953b36bc7d41cb6bcb7c8449c044fc0c08adb0fb",
      index: "0x0",
      dep_type: "dep_group",
    },
    sudt: {
      code_hash: DevnetDeps.scripts.l1Sudt.typeHash,
      hash_type: DevnetDeps.scripts.l1Sudt.typeScript.hash_type as HashType,
      tx_hash: DevnetDeps.scripts.l1Sudt.cellDep.out_point.tx_hash,
      index: DevnetDeps.scripts.l1Sudt.cellDep.out_point.index,
      dep_type: DevnetDeps.scripts.l1Sudt.cellDep.dep_type as DepType,
    },
  },
  CKB_INDEXER_URL: "http://127.0.0.1:8116",
  CKB_RPC_URL: "http://127.0.0.1:8114",
  SCANNER_URL: "",
};

export const DevnetConfigV1: LightGodwokenConfig = {
  lumosConfig: lumosConfig,
  layer1Config: layer1Config,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: DevnetDeps.scripts.deposit.typeHash,
        cell_dep: DevnetDeps.scripts.deposit.cellDep as CellDep,
      },
      withdrawal_lock: {
        script_type_hash: DevnetDeps.scripts.withdraw.typeHash,
        cell_dep: DevnetDeps.scripts.withdraw.cellDep as CellDep,
      },
      eth_account_lock: {
        script_type_hash: DevnetDeps.scripts.ethAccount.typeHash,
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: DevnetDeps.rollupCell.typeHash,
      rollup_type_script: DevnetDeps.rollupCell.typeScript as Script,
    },

    GW_POLYJUICE_RPC_URL: "http://127.0.0.1:8024",
    SCANNER_URL: "", // only used this field in the browser projects
    SCANNER_API: "", // only used this field in the browser projects
    CHAIN_NAME: "Godwoken Devnet v1",
    FINALITY_BLOCKS: 100,
    BLOCK_PRODUCE_TIME: 30,
    MIN_CANCEL_DEPOSIT_TIME: 604800, // 7 days in seconds

    MULTICALL_ADDRESS: "", // might not need this
  },
  tokenList: [],
};
