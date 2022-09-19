import { Hash, Hexadecimal, Script, CellDep, HashType } from '@ckb-lumos/base';
import { Indexer as IndexerBase } from '@ckb-lumos/base';
import { Indexer } from '@ckb-lumos/lumos';
import { RPC } from 'ckb-js-toolkit';
import { absolutePath, writeJson } from '../utils/file';

const CKB_RPC_URL = 'http://127.0.0.1:8114';
const CKB_INDEXER_URL = 'http://127.0.0.1:8116';
const GODWOKEN_RPC_URL = 'http://127.0.0.1:8024';

async function main() {
  const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
  const poly = await getPolyVersion();

  const gwScripts = poly.nodeInfo.gwScripts;
  const eoaScripts = poly.nodeInfo.eoaScripts;
  const [
    omniLock,
    l1Sudt,
    deposit,
    withdraw,
    ethAccount,
  ] = await Promise.all([
    await getGeneratedScript(indexer, gwScripts.omniLock),
    await getGeneratedScript(indexer, gwScripts.l1Sudt),
    await getGeneratedScript(indexer, gwScripts.deposit),
    await getGeneratedScript(indexer, gwScripts.withdraw),
    await getGeneratedScript(indexer, eoaScripts.eth),
  ]);

  const rollupCell = poly.nodeInfo.rollupCell;
  const config: Partial<GeneratedConfig> = {
    rollupCell,
    scripts: {
      omniLock,
      l1Sudt,
      deposit,
      withdraw,
      ethAccount,
    },
  };

  const actualPath = await writeJson(absolutePath('src/config-deps/devnet.json'), config);
  console.log(`config-deps file for devnet is generated at "${actualPath}"`);
}

async function getPolyVersion(): Promise<PolyConfig> {
  const rpc = new RPC(GODWOKEN_RPC_URL);
  return rpc['poly_version']();
}

async function getCellByType(indexer: IndexerBase, type: Script) {
  const collector = indexer.collector({ type });
  for await (const cell of collector.collect()) {
    return cell;
  }
}

async function getGeneratedScript(indexer: IndexerBase, config: PolyScript): Promise<GeneratedField> {
  const cell = await getCellByType(indexer, config.script);
  if (!cell) throw new Error(`No cell was found for the type script: ${JSON.stringify(config)}`);

  return {
    typeScript: config.script,
    typeHash: config.typeHash,
    hashType: cell.cell_output.type!.hash_type,
    cellDep: {
      out_point: cell.out_point!,
      dep_type: 'code' // TODO: how to determine this field?
    },
  };
}

main();

// Poly types
interface PolyScript {
  script: Script;
  typeHash: Hash;
}
interface PolyConfig {
  nodeInfo: {
    rollupCell: {
      typeHash: Hash;
      typeScript: Script;
    };
    rollupConfig: {
      requiredStakingCapacity: Hexadecimal;
      challengeMaturityBlocks: Hexadecimal;
      finalityBlocks: Hexadecimal;
      rewardBurnRate: Hexadecimal;
      chainId: Hexadecimal;
    };
    gwScripts: {
      deposit: PolyScript;
      withdraw: PolyScript;
      l1Sudt: PolyScript;
      omniLock: PolyScript;
    };
    eoaScripts: {
      eth: PolyScript;
    };
  };
}

// Generate config template
interface GeneratedConfig {
  scripts: {
    omniLock: GeneratedField;
    l1Sudt: GeneratedField;
    deposit: GeneratedField;
    withdraw: GeneratedField;
    ethAccount: GeneratedField;
  };
  rollupCell: {
    typeHash: Hash;
    typeScript: Script;
  };
}
interface GeneratedField {
  typeScript: Script;
  typeHash: Hash;
  cellDep: CellDep;
  hashType: HashType;
}
