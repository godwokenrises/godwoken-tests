import { Address, HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network, networks, allNetworks } from '../config';
import { GodwokenWeb3 } from '../godwoken/web3';
import {
  addHexPrefix,
  encodeLayer2DepositAddress,
  privateKeyToLayer2DepositAddress,
  ethAddressToOmniCkbAddress
} from '../utils/address';

export default function setupGetL2Address(program: Command) {
  program
    .command('get-l2-address')
    .description('calculate L1 deposit address (transfer to this address for depositing), provide either --private-key or --eth-address')
    .option('-p, --private-key <HEX_STRING>', 'private key')
    .option('-e --eth-address <HEX_STRING>', 'eth address')
    .option('-c --ckb-address <ADDRESS>', 'ckb deposit-from address')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(allNetworks)
        .default(Network.TestnetV1)
    )
    .action(getL2Address)
  ;
}

async function getL2Address(params: {
  privateKey?: HexString;
  ckbAddress?: Address;
  ethAddress?: HexString;
  network: Network;
}) {
  if (!params.privateKey && !params.ethAddress) {
    throw new Error('provide either `privateKey` or `ethAddress`');
  }

  const config = networks[params.network];
  const gw = new GodwokenWeb3(config.rpc);

  if (params.privateKey) {
    const privateKey = addHexPrefix(params.privateKey);
    const result = await privateKeyToLayer2DepositAddress(config, gw, privateKey);
    console.log(result);
  } else {
    const ethAddress = addHexPrefix(params.ethAddress!);
    const fromCkbAddress = params.ckbAddress ?? ethAddressToOmniCkbAddress(ethAddress, config);
    const result = await encodeLayer2DepositAddress(config, gw, fromCkbAddress, ethAddress);
    console.log(result);
  }
}
