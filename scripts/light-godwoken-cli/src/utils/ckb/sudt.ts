import { BI, Cell } from '@ckb-lumos/lumos';
import { HexString, Script, utils } from '@ckb-lumos/base';
import { CkbIndexer } from '@ckb-lumos/ckb-indexer/lib/indexer';
import { LightGodwokenConfig } from '../../libraries/light-godwoken';
import { privateKeyToBlake160LockScript } from './blake160';

export const SUDT_CELL_CAPACITY = 144_00000000;

export function createSudtTypeScript(sudtTypeArgs: string, config: LightGodwokenConfig): Script {
  const sudtScriptConfig = config.layer1Config.SCRIPTS.sudt;
  return {
    code_hash: sudtScriptConfig.code_hash,
    hash_type: sudtScriptConfig.hash_type,
    args: sudtTypeArgs,
  };
}

export async function collectSudtCells(params: {
  indexer: CkbIndexer,
  privateKey: HexString,
  sudtTypeArgs: HexString,
  config: LightGodwokenConfig,
  minimumAmount?: BI,
}) {
  const { indexer, privateKey, sudtTypeArgs, config, minimumAmount } = params;
  const sudtCollector = indexer.collector({
    lock: privateKeyToBlake160LockScript(privateKey, config.lumosConfig),
    type: createSudtTypeScript(sudtTypeArgs, config),
  });

  const result = {
    cells: [] as Cell[],
    amount: BI.from(0),
    capacity: BI.from(0),
    freeCapacity: BI.from(0),
  };

  for await (const cell of sudtCollector.collect()) {
    result.cells.push(cell);

    const amount = utils.readBigUInt128LECompatible(cell.data);
    result.amount = amount.add(amount);

    const capacity = BI.from(cell.cell_output.capacity);
    result.capacity = capacity.add(capacity);

    const freeCapacity = capacity.sub(SUDT_CELL_CAPACITY);
    if (freeCapacity.gt(0)) {
      result.freeCapacity = freeCapacity.add(freeCapacity);
    }

    if (minimumAmount?.gt(0) && amount.gte(minimumAmount)) {
      break;
    }
  }

  return result;
}
