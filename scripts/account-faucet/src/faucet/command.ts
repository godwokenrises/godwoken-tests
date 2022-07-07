import config from '../config';
import { Command } from 'commander';
import { Address, HexString } from '@ckb-lumos/base';
import { GodwokenWeb3 } from '../godwoken/web3';
import { claimFaucetForCkbAddress } from './faucet';
import { encodeLayer2DepositAddress, privateKeyToLayer2DepositAddress, toHexString } from './address';

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
    .option('-c --ckb-address <ckbAddress>', '[HexString] ckb address (optional)')
    .option('-e --eth-address <ethAddress>', '[HexString] eth address (optional)')
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
    depositAddress = await encodeLayer2DepositAddress(gw, toHexString(ckbAddress!), toHexString(ethAddress!));
  }

  await claimFaucetForCkbAddress(depositAddress);
}