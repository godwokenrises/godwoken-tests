import { Network, networks } from '../config';
import { Command } from 'commander';
import { Address, HexString } from '@ckb-lumos/base';
import { GodwokenWeb3 } from '../godwoken/web3';
import { claimFaucetForCkbAddress } from './faucet';
import { encodeLayer2DepositAddress, privateKeyToLayer2DepositAddress, toAddress, toHexString } from './address';

// Default faucet refund address
// This is also the address that sends the faucet transaction
const defaultCkbAddress = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x';

export interface FaucetCommand {
  privateKey?: HexString | string;
  ckbAddress?: HexString | string;
  ethAddress?: HexString | string;
  network: Network;
}

export function setupFaucetCommand(program: Command) {
  program
    .command('claim')
    .description('claim faucet for ckb account')
    .option('-p, --private-key <privateKey>', '[HexString] ckb private key')
    .option('-e --eth-address <ethAddress>', '[HexString] eth address (optional)')
    .option('-c --ckb-address <ckbAddress>', '[Address] ckb address (optional)', defaultCkbAddress)
    .option('-n, --network <network>', '[string] network name', Network.TestnetV1)
    .action(runFaucet);
}

export async function runFaucet(params: FaucetCommand) {
  const { privateKey, ckbAddress, ethAddress, network } = params;
  if (!privateKey && !ethAddress) {
    throw new Error('provide either `privateKey` or `ethAddress`');
  }
  if (network === Network.MainnetV1) {
    throw new Error('cannot claim faucet on mainnet');
  }

  const config = networks[network];
  const gw = new GodwokenWeb3(config.rpc);

  let depositAddress: Address;
  if (privateKey) {
    depositAddress = await privateKeyToLayer2DepositAddress(config, gw, toHexString(privateKey));
  } else {
    depositAddress = await encodeLayer2DepositAddress(config, gw, toAddress(ckbAddress!), toHexString(ethAddress!));
  }

  await claimFaucetForCkbAddress(depositAddress);
}

export function setupCalculateLayer2AddressCommand(program: Command) {
  program
    .command('get-l2-address')
    .description('calculate layer 2 deposit address')
    .option('-p, --private-key <privateKey>', '[HexString] ckb private key')
    .option('-e --eth-address <ethAddress>', '[HexString] eth address (optional)')
    .option('-c --ckb-address <ckbAddress>', '[Address] ckb address (optional)', defaultCkbAddress)
    .option('-n, --network <network>', '[string] network name', Network.TestnetV1)
    .action(runCalculateLayer2Address);
}

export interface CalculateLayer2AddressCommand {
  privateKey?: HexString | string;
  ckbAddress?: HexString | string;
  ethAddress?: HexString | string;
  network: Network;
}

async function runCalculateLayer2Address(params: CalculateLayer2AddressCommand) {
  const { privateKey, ckbAddress, ethAddress, network } = params;
  if (!privateKey && !ethAddress) {
    throw new Error('provide either `privateKey` or `ethAddress`');
  }

  const config = networks[network];
  const gw = new GodwokenWeb3(config.rpc);

  if (privateKey) {
    console.log(
      await privateKeyToLayer2DepositAddress(config, gw, toHexString(privateKey))
    );
  } else {
    console.log(
      await encodeLayer2DepositAddress(config, gw, toAddress(ckbAddress!), toHexString(ethAddress!))
    );
  }
}