import { writeFile, access, mkdir } from 'fs/promises';
import { resolve, relative } from 'path';
import { constants } from 'fs';
import { RPC } from 'ckb-js-toolkit';
import { Indexer } from '@ckb-lumos/lumos';
import { Indexer as IndexerBase } from '@ckb-lumos/base';
import { Hash, Hexadecimal, Script, CellDep, HashType } from '@ckb-lumos/base';

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

  const actualPath = await writeJson('../config-deps/devnet.json', config);
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

async function writeJson<T extends object>(pathWithFilename: string, json: T) {
  const targetPath = resolve(__dirname, pathWithFilename);
  pathWithFilename = relative(process.cwd(), targetPath);

  const withFilename = pathWithFilename.split('/');
  if (withFilename.length > 1) {
    const withoutFilename = withFilename.slice(0, withFilename.length - 1);
    await createPathIfNotExist(withoutFilename.join('/'));
  }

  await writeFile(pathWithFilename, JSON.stringify(json, null, 2));
  return pathWithFilename;
}

async function createPathIfNotExist(path: string) {
  const list = path.split('/');
  const startI = path.startsWith('../') ? 2 : 1;

  let notExists = false;
  for (let i = startI; i <= list.length; i++) {
    const currentPath = list.slice(0, i).join('/');
    if (notExists) {
      await mkdir(currentPath);
      continue;
    }

    try {
      await access(currentPath, constants.R_OK);
    } catch {
      if (!notExists) notExists = true;
      await mkdir(currentPath);
    }
  }
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
