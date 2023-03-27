import { bytes, number, blockchain, createObjectCodec, enhancePack } from '@ckb-lumos/codec';
import { BI, Indexer } from '@ckb-lumos/lumos';
import { utils } from "ethers";
import { Command } from 'commander';
import { Network, networks } from '../config';
import { createLightGodwoken } from '../utils/client';

const { Uint128, Uint64 } = number;
const { Byte32 } = blockchain;

export function setupGetLegacyWithdrawalsStats(program: Command) {
  program.command('get-legacy-withdrawals-stats')
    .description("Get legacy withdrawals' statistics, only supports mainnet_v0 network")
    .action(async () => await getLegacyWithdrawalsStats())
  ;
}

export async function getLegacyWithdrawalsStats() {
  const network = networks[Network.MainnetV0];
  const client = await createLightGodwoken({
    privateKey: "".padStart(64, "e"),
    rpc: network.rpc,
    network: network.network,
    version: network.version,
    config: network.lightGodwokenConfig,
  });

  const layer1Config = network.lightGodwokenConfig!.layer1Config;
  const layer2Config = network.lightGodwokenConfig!.layer2Config;
  const indexer = new Indexer(layer1Config.CKB_INDEXER_URL, layer1Config.CKB_RPC_URL);
  const lastFinalizedBlockNumber = await client.provider.getLastFinalizedBlockNumber();

  const collector = indexer.collector({
    lock: {
      code_hash: layer2Config.SCRIPTS.withdrawal_lock.script_type_hash,
      args: layer2Config.ROLLUP_CONFIG.rollup_type_hash,
      hash_type: "type",
    },
  });

  let total = 0;
  let finalized = 0;
  let sudtCells = 0;
  let capacity = BI.from(0);
  for await (const cell of collector.collect()) {
    const argsHex = cell.cell_output.lock.args;
    const args = WithdrawalV0LockArgsV0.unpack(bytes.bytify(argsHex));

    total += 1;
    capacity = capacity.add(cell.cell_output.capacity);
    if (args.withdrawalBlockNumber.lte(lastFinalizedBlockNumber)) {
      finalized += 1;
    }
    if (!!cell.cell_output.type) {
      sudtCells += 1;
    }
  }

  console.log('total legacy withdrawals:');
  console.log('-- total:', total);
  console.log('-- finalized:', finalized);
  console.log('-- non-finalized:', total - finalized);
  console.log('total capacity in withdrawals:');
  console.log('--', capacity.toString(), 'shannons');
  console.log('--', utils.formatUnits(capacity.toString(), 8), 'CKB');
  console.log('legacy withdrawal cells in categories:');
  console.log('-- pure ckb cells:', total - sudtCells);
  console.log('-- sudt cells:', sudtCells);
}

const RawWithdrawalLockArgsV0 = createObjectCodec({
  rollupHash: Byte32,
  accountScriptHash: Byte32,
  withdrawalBlockhash: Byte32,
  withdrawalBlockNumber: Uint64,
  // buyer can pay sell_amount token to unlock
  sudtScriptHash: Byte32,
  sellAmount: Uint128,
  sellCapacity: Uint64,
  // layer1 lock to withdraw after challenge period
  ownerLockHash: Byte32,
  // layer1 lock to receive the payment, must exists on the chain
  paymentLockHash: Byte32,
});
export const WithdrawalV0LockArgsV0 = enhancePack(
  RawWithdrawalLockArgsV0,
  () => new Uint8Array(0),
  (buf: Uint8Array) => ({
    rollupHash: buf.slice(0, 32),
    accountScriptHash: buf.slice(32, 64),
    withdrawalBlockhash: buf.slice(64, 96),
    withdrawalBlockNumber: buf.slice(96, 104), // Uint64 = 8 length
    sudtScriptHash: buf.slice(104, 136),
    sellAmount: buf.slice(136, 152),
    sellCapacity: buf.slice(152, 160),
    ownerLockHash: buf.slice(160, 192),
    paymentLockHash: buf.slice(192, 224),
  }),
);

