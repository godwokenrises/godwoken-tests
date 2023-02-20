import { utils } from 'ethers';
import { Command, Option } from 'commander';
import { helpers } from '@ckb-lumos/lumos';
import { utils as lumosUtils, HexString } from '@ckb-lumos/base';
import { createSudtTypeScript } from '../utils/ckb/sudt';
import { createLightGodwoken } from '../utils/client';
import { isAllDefinedOrAllNot } from '../utils/format';
import { getConfig } from '../utils/config';
import { Network } from '../config';

export default function setupL1Transfer(program: Command) {
  program
    .command('l1-transfer')
    .description('Transfer CKB to other address on layer1')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .requiredOption('-c, --capacity <STRING>', 'transfer capacity (1:1CKB)')
    .requiredOption('-r, --recipient <STRING>', 'The recipient layer1 address')
    .option('-sl, --sudt-lock-args <HEX_STRING>', 'transfer sudt L1 lock_args')
    .option('-sa, --sudt-amount <STRING>', 'transfer sudt amount')
    .option('-sd, --sudt-decimals <STRING>', 'sudt decimals')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(async (...args: Parameters<typeof l1Transfer>) => {
      await l1Transfer(...args);
    })
  ;
}

export async function l1Transfer(params: {
  privateKey: HexString;
  network: Network;
  capacity: string;
  recipient: HexString;
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
  try {
    helpers.parseAddress(params.recipient, {
      config: lightGodwokenConfig.lumosConfig as any,
    });
  } catch {
    throw new Error('The recipient layer1 address is invalid');
  }

  const capacity = utils.parseUnits(params.capacity, 8);
  const sudtType = params.sudtLockArgs
    ? createSudtTypeScript(params.sudtLockArgs, lightGodwokenConfig)
    : void 0;
  const sudtAmount = params.sudtAmount
    ? utils.parseUnits(params.sudtAmount, params.sudtDecimals).toHexString()
    : '0x0';

  console.debug(`[l1-transfer] from: ${client.provider.getL1Address()}`);
  console.debug(`[l1-transfer] to: ${client.provider.getL2Address()}`);

  if (sudtType) {
    const typeHash = lumosUtils.computeScriptHash(sudtType);
    console.debug(`[l1-transfer] sudt-type-hash: ${typeHash}`);
    console.debug(`[l1-transfer] sudt-amount: ${params.sudtAmount}`);
  } else {
    console.debug(`[l1-transfer] capacity: ${params.capacity} CKB`);
  }

  const waitForCompletion = params.waitForCompletion !== false;
  // @ts-ignore
  const hash = await client.l1Transfer({
    toAddress: params.recipient,
    sudtType: sudtType,
    amount: sudtType ? sudtAmount : capacity.toHexString(),
  });

  console.debug(`[l1-transfer] committed, tx-hash: ${hash}`);
  if (waitForCompletion) {
    try {
      // @ts-ignore
      await client.provider.waitForL1Transaction(hash);
      console.debug(`[l1-transfer] succeed, tx-hash: ${hash}`);
      return hash;
    } catch (e) {
      console.debug(`[l1-transfer] failed, tx-hash: ${hash}, error: ${e}`);
      throw e;
    }
  } else {
    return hash;
  }
}
