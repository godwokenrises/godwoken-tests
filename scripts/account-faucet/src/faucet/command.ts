import config from '../config';
import { Command } from 'commander';
import { Address, HexString } from '@ckb-lumos/base';
import { GodwokenWeb3 } from '../godwoken/web3';
import { claimFaucetForCkbAddress, getAddressClaimEvents } from './faucet';
import { encodeLayer2DepositAddress, privateKeyToLayer2DepositAddress, toAddress, toHexString } from './address';

const defaultCkbAddress = '0xckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x';

export interface FaucetCommand {
  privateKey?: HexString | string;
  ckbAddress?: HexString | string;
  ethAddress?: HexString | string;
  rpc?: string;
}

export function setupFaucetCommand(program: Command) {
  program
    .command('claim')
    .description('claim faucet for ckb account')
    .option('-p, --private-key <privateKey>', '[HexString] ckb private key')
    .option('-e --eth-address <ethAddress>', '[HexString] eth address (optional)')
    .option('-c --ckb-address <ckbAddress>', '[Address] ckb address (optional)', defaultCkbAddress)
    .option('-r, --rpc <rpc>', '[string] godwoken rpc url')
    .action(runFaucet);
}

export async function runFaucet(params: FaucetCommand) {
  const { privateKey, ckbAddress, ethAddress, rpc } = params;
  if (!privateKey && !(ckbAddress && ethAddress)) {
    throw new Error('provide either `privateKey` or `ckbAddress` and `ethAddress`');
  }

  const gw = new GodwokenWeb3(rpc || config.rpc);

  let depositAddress: Address;
  if (privateKey) {
    depositAddress = await privateKeyToLayer2DepositAddress(gw, toHexString(privateKey));
  } else {
    depositAddress = await encodeLayer2DepositAddress(gw, toAddress(ckbAddress!), toHexString(ethAddress!));
  }

  // await getAddressClaimEvents(depositAddress);
  await claimFaucetForCkbAddress(depositAddress);
}