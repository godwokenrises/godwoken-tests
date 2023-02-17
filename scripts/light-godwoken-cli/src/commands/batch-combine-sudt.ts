import { Command, Option } from 'commander';
import { BI, helpers } from '@ckb-lumos/lumos';
import { number, bytes } from '@ckb-lumos/codec';
import { HexString, Cell, CellDep } from '@ckb-lumos/base';
import { LightGodwokenConfig } from '../libraries/light-godwoken';
import { Network } from '../config';
import { getConfig } from '../utils/config';
import { privateKeyToDerivedAccounts } from '../utils/account';
import { createLightGodwokenByNetworkConfig } from '../utils/client';
import { addHexPrefix, mustBeInteger } from '../utils/format';

export default function setupBatchCombineSudt(program: Command) {
  program
    .command('batch-combine-sudt')
    .description('Batch combine sudt cells into a single sudt cell')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .option('--derived-count <INT>', 'amount of derived accounts to use', '30')
    .option('--sudt-lock-args <HEX_STRING>', 'transfer sudt L1 lock_args', '0x5c7253696786b9eddd34e4f6b6e478ec5742bd36569ec60c1d0487480ba4f9e3')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.AlphanetV1)
    )
    .action(async (...args: Parameters<typeof batchCombineSudt>) => {
      await batchCombineSudt(...args);
    })
  ;
}

export async function batchCombineSudt(payload: {
  network: Network,
  privateKey: HexString,
  sudtLockArgs: HexString,
  derivedCount: string,
}) {
  const derivedCount = mustBeInteger(payload.derivedCount, 'derivedCount');
  const accounts = privateKeyToDerivedAccounts(addHexPrefix(payload.privateKey), derivedCount);
  const promises = Promise.allSettled(accounts.map((account) => {
    return combineSudtCells({
      network: payload.network,
      privateKey: account.privateKey,
      sudtLockArgs: addHexPrefix(payload.sudtLockArgs),
    });
  }));

  const results = await promises;
  console.log(results);
  return results;
}

async function combineSudtCells(payload: {
  network: Network,
  privateKey: HexString,
  sudtLockArgs: HexString,
  minCombineLimit?: number,
}) {
  const config = getConfig(payload.network);
  const client = await createLightGodwokenByNetworkConfig(payload.privateKey, config);
  const layer1Lock = client.provider.getLayer1Lock();
  const lightGodwokenConfig = client.getConfig();

  const collector = client.provider.ckbIndexer.collector({
    lock: layer1Lock,
    type: {
      code_hash: lightGodwokenConfig.layer1Config.SCRIPTS.sudt.code_hash,
      hash_type: lightGodwokenConfig.layer1Config.SCRIPTS.sudt.hash_type,
      args: payload.sudtLockArgs,
    },
    // if sudt cell's data has more info than just amount (16 bytes), skip it
    // because we don't know what the extension bytes contain
    outputDataLenRange: ["0x10", "0x11"],
  });

  const cells: Cell[] = [];
  let collectedCapacity = BI.from(0);
  let collectedSudtAmount = BI.from(0);
  for await (const cell of collector.collect()) {
    collectedCapacity = collectedCapacity.add(cell.cell_output.capacity);
    collectedSudtAmount = collectedSudtAmount.add(number.Uint128LE.unpack(cell.data));
    cells.push(cell);
  }

  const minCombineLimit = payload.minCombineLimit ?? 5;
  if (cells.length < minCombineLimit) {
    const address = client.provider.getL1Address();
    console.log(`[${address}] sudt cells less than min-combine-limit(${minCombineLimit}), skipping`);
    return;
  }

  const outputSudtCell = generateOutputSudtCell(cells[0], collectedSudtAmount);
  const returnCapacity = collectedCapacity.sub(outputSudtCell.cell_output.capacity);
  const outputPureCell = {
    cell_output: {
      capacity: returnCapacity.toHexString(),
      lock: layer1Lock,
    },
    data: '0x',
  };

  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: client.provider.ckbIndexer,
  });
  txSkeleton = txSkeleton
    .update('cellDeps', (cellDeps) => {
      return cellDeps.push(...generateCellDeps(lightGodwokenConfig));
    })
    .update('inputs', (inputs) => {
      return inputs.push(...cells);
    })
    .update('outputs', (outputs) => {
      return outputs.push(outputSudtCell, outputPureCell);
    })
  ;

  const unsignedTx = await client.payTxFee(txSkeleton);
  const signedTx = await client.provider.signL1TxSkeleton(unsignedTx);
  const txHash = await client.provider.sendL1Transaction(signedTx);
  return {
    txHash: txHash,
    cells: cells.length,
    collectedSudtAmount: collectedSudtAmount.toString(),
    collectedCapacity: collectedCapacity.toString(),
    returnCapacity: returnCapacity.toString(),
  };
}

function generateOutputSudtCell(template: Cell, totalSudtAmount: BI) {
  const outputSudtCell: Cell = {
    cell_output: {
      ...template.cell_output,
    },
    data: bytes.hexify(
      number.Uint128LE.pack(totalSudtAmount)
    ),
  };

  const requireCapacity = helpers.minimalCellCapacityCompatible(outputSudtCell);
  outputSudtCell.cell_output.capacity = requireCapacity.toHexString();
  return outputSudtCell;
}

function generateCellDeps(config: LightGodwokenConfig): CellDep[] {
  const scripts = config.layer1Config.SCRIPTS;
  return [
    {
      out_point: {
        tx_hash: scripts.omni_lock.tx_hash,
        index: scripts.omni_lock.index,
      },
      dep_type: scripts.omni_lock.dep_type,
    },
    {
      out_point: {
        tx_hash: scripts.secp256k1_blake160.tx_hash,
        index: scripts.secp256k1_blake160.index,
      },
      dep_type: scripts.secp256k1_blake160.dep_type,
    },
    {
      out_point: {
        tx_hash: scripts.sudt.tx_hash,
        index: scripts.sudt.index,
      },
      dep_type: scripts.sudt.dep_type,
    },
  ];
}
