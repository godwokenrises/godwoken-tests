import { utils } from 'ethers';
import { Command, Option } from 'commander';
import { Hash, HexString } from '@ckb-lumos/base';
import { utils as lumosUtils } from '@ckb-lumos/lumos';
import { Network } from '../config';
import { createSudtTypeScript } from '../utils/ckb/sudt';
import { createLightGodwoken } from '../utils/client';
import { isAllDefinedOrAllNot } from '../utils/format';
import { getConfig } from '../utils/config';

export default function setupWithdrawal(program: Command) {
  program
    .command('withdraw')
    .description('Withdraw capacity from Godwoken layer2 to layer1')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .requiredOption('-c, --capacity <STRING>', 'withdraw capacity (1:1CKB)')
    .option('-sl, --sudt-lock-args <HEX_STRING>', 'withdraw sudt l1 lock_args')
    .option('-sa, --sudt-amount <STRING>', 'withdraw sudt amount')
    .option('-sd, --sudt-decimals <STRING>', 'sudt decimals')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(async (...args: Parameters<typeof withdraw>) => {
      await withdraw(...args);
    })
  ;
}

export async function withdraw(params: {
  privateKey: HexString;
  capacity: string;
  network: Network;
  sudtLockArgs?: string;
  sudtAmount?: string;
  sudtDecimals?: string;
}) {
  if (!isAllDefinedOrAllNot([params.sudtLockArgs, params.sudtAmount, params.sudtDecimals])) {
    throw new Error('Missing param sudtLockArgs, or sudtAmount, or sudtDecimals');
  }

  const network = getConfig(params.network);
  const client = await createLightGodwoken({
    privateKey: params.privateKey,
    rpc: network.rpc,
    network: network.network,
    version: network.version,
    config: network.lightGodwokenConfig,
  });

  const lightGodwokenConfig = client.provider.getConfig();
  const capacity = utils.parseUnits(params.capacity, 8);
  const sudtType = params.sudtLockArgs
    ? createSudtTypeScript(params.sudtLockArgs, lightGodwokenConfig)
    : void 0;
  const sudtScriptHash = sudtType
    ? lumosUtils.computeScriptHash(sudtType)
    : '0x0000000000000000000000000000000000000000000000000000000000000000';
  const sudtAmount = params.sudtAmount
    ? utils.parseUnits(params.sudtAmount, params.sudtDecimals).toHexString()
    : '0x0';

  console.debug(`[withdraw] from: ${client.provider.getL2Address()}`);
  console.debug(`[withdraw] to: ${client.provider.getL1Address()}`);
  console.debug(`[withdraw] capacity: ${params.capacity} pCKB`);

  if (sudtType) {
    console.debug(`[withdraw] sudt-type-hash: ${sudtScriptHash}`);
    console.debug(`[withdraw] sudt-amount: ${params.sudtAmount}`);
  }

  const event = await client.withdrawWithEvent({
    capacity: capacity.toHexString(),
    amount: sudtAmount,
    sudt_script_hash: sudtScriptHash,
  });

  return new Promise<Hash>((resolve, reject) => {
    event.on('pending', (txHash) => {
      console.debug('[withdraw] pending: tx-hash: ', txHash);
      resolve(txHash);
    });
    event.on('success', (txHash) => {
      console.debug('[withdraw] succeed: tx-hash: ', txHash);
      resolve(txHash);
    });
    event.on('fail', (error) => {
      console.debug('[withdraw] failed: ', error.message);
      reject(error);
    });

    // FIXME: try-catch cannot catch errors in EventEmitter's async callbacks
    // @ts-ignore
    event.on('error', (e) => {
      console.debug('[withdraw] caught: ', e);
      reject(e);
    });
  });
}
