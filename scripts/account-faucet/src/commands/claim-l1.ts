import { Address, HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network, networks } from '../config';
import { privateKeyToOmniCkbAddress, addHexPrefix } from '../utils/address';
import { claimFaucetForCkbAddress } from '../utils/faucet';

export default function setupClaimForL1(program: Command) {
  program
    .command('claim-l1')
    .description('claim faucet for L1, provide either --private-key or --ckb-address')
    .option('-p, --private-key <HEX_STRING>', 'ckb private key')
    .option('-c --ckb-address <ADDRESS>', 'ckb omni-lock address')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(claimForL1)
  ;
}

export async function claimForL1(params: {
  privateKey?: HexString;
  ckbAddress?: Address;
  network: Network;
}) {
  if (!params.privateKey && !params.ckbAddress) {
    throw new Error('provide either `privateKey` or `ckbAddress`');
  }

  const config = networks[params.network];
  const depositAddress = (() => {
    if (params.privateKey) return privateKeyToOmniCkbAddress(addHexPrefix(params.privateKey), config);
    return params.ckbAddress!;
  })();

  await claimFaucetForCkbAddress(depositAddress);
}
