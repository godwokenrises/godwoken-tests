import { utils } from 'ethers';
import { Command, Option } from 'commander';
import { utils as lumosUtils, HexString, Hash } from '@ckb-lumos/base';
import { Network } from '../config';
import { createSudtTypeScript } from '../utils/ckb/sudt';
import { createLightGodwoken } from '../utils/client';
import { isAllDefinedOrAllNot } from '../utils/format';
import { getConfig } from '../utils/config';

export default function setupDeposit(program: Command) {
  program
    .command('deposit')
    .description('Deposit capacity from layer1 to Godwoken layer2')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .requiredOption('-c, --capacity <STRING>', 'deposit capacity (1:1CKB)')
    .option('-sl, --sudt-lock-args <HEX_STRING>', 'deposit sudt L1 lock_args')
    .option('-sa, --sudt-amount <STRING>', 'deposit sudt amount')
    .option('-sd, --sudt-decimals <STRING>', 'sudt decimals')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(async (...args: Parameters<typeof deposit>) => {
      await deposit(...args);
    })
  ;
}

export async function deposit(params: {
  privateKey: HexString;
  network: Network;
  capacity: string;
  sudtLockArgs?: string;
  sudtAmount?: string;
  sudtDecimals?: string;
  waitForCompletion?: boolean;
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
  const sudtAmount = params.sudtAmount
    ? utils.parseUnits(params.sudtAmount, params.sudtDecimals).toHexString()
    : '0x0';

  console.debug(`[deposit] from: ${client.provider.getL1Address()}`);
  console.debug(`[deposit] to: ${client.provider.getL2Address()}`);
  console.debug(`[deposit] capacity: ${params.capacity} CKB`);

  if (sudtType) {
    const typeHash = lumosUtils.computeScriptHash(sudtType);
    console.debug(`[deposit] sudt-type-hash: ${typeHash}`);
    console.debug(`[deposit] sudt-amount: ${params.sudtAmount}`);
  }

  const waitForCompletion = params.waitForCompletion !== false;
  const event = await client.depositWithEvent(
    {
      capacity: capacity.toHexString(),
      sudtType: sudtType,
      amount: sudtAmount,
    },
    waitForCompletion,
  );
  function destroyEventEmitter() {
    event.removeAllListeners();
  }

  return new Promise<Hash>((resolve, reject) => {
    event.on('sent', (txHash) => {
      console.debug(`[deposit] committed, tx-hash: ${txHash}`);
      if (!waitForCompletion) {
        destroyEventEmitter();
        resolve(txHash);
      }
    });
    event.on('success', (txHash) => {
      console.debug(`[deposit] succeed, tx-hash: ${txHash}`);
      if (waitForCompletion) {
        destroyEventEmitter();
        resolve(txHash);
      }
    });
    event.on('fail', (e) => {
      console.debug('[deposit] failed: ', e);
      destroyEventEmitter();
      reject(e);
    });

    // FIXME: try-catch cannot catch errors in EventEmitter's async callbacks
    // @ts-ignore
    event.on('error', (e) => {
      console.debug('[deposit] failed in caught: ', e);
      destroyEventEmitter();
      reject(e);
    });
  });
}
