import { utils } from 'ethers';
import { Command, Option } from 'commander';
import { HexString } from '@ckb-lumos/base';
import { Network } from '../config';
import { createSudtTypeScript } from '../utils/sudt';
import { createLightGodwoken } from '../utils/client';
import { isAllDefinedOrAllNot } from '../utils/check';
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
    .action(deposit)
  ;
}

export async function deposit(params: {
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
  const lightGodwokenV1 = await createLightGodwoken({
    privateKey: params.privateKey,
    rpc: network.rpc,
    network: network.network,
    version: network.version,
    config: network.lightGodwokenConfig,
  });

  const lightGodwokenConfig = lightGodwokenV1.provider.getConfig();
  const sudtType = params.sudtLockArgs
    ? createSudtTypeScript(params.sudtLockArgs, lightGodwokenConfig)
    : void 0;
  const sudtAmount = params.sudtAmount
    ? utils.parseUnits(params.sudtAmount, params.sudtDecimals).toHexString()
    : '0x0';

  const capacity = utils.parseUnits(params.capacity, 8);
  const result = await lightGodwokenV1.deposit({
    capacity: capacity.toHexString(),
    sudtType: sudtType,
    amount: sudtAmount,
  });

  console.log('deposit-tx: ', result);
}
