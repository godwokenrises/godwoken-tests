import { Command, Option } from 'commander';
import { Network, networks } from '../config';
import { Address, HexString } from '@ckb-lumos/base';
import { GodwokenWeb3 } from '../godwoken/web3';
import { claimFaucetForCkbAddress } from '../utils/faucet';
import {
  DEFAULT_CKB_DEPOSIT_ADDRESS,
  encodeLayer2DepositAddress,
  privateKeyToLayer2DepositAddress,
  removeHexPrefix,
  addHexPrefix
} from '../utils/address';

export default function setupClaimForL2(program: Command) {
  program
    .command('claim-l2')
    .description('claim faucet for L2, provide either --private-key or --eth-address')
    .option('-p, --private-key <HEX_STRING>', 'private key')
    .option('-e --eth-address <HEX_STRING>', 'eth address')
    .option('-c --ckb-address <ADDRESS>', 'ckb deposit-from address', DEFAULT_CKB_DEPOSIT_ADDRESS)
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(claimForL2)
  ;
}

export async function claimForL2(params: {
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

  let depositAddress: Address;
  if (params.privateKey) {
    depositAddress = await privateKeyToLayer2DepositAddress(
      config,
      gw,
      addHexPrefix(params.privateKey)
    );
  } else {
    depositAddress = await encodeLayer2DepositAddress(
      config,
      gw,
      removeHexPrefix(params.ckbAddress!),
      addHexPrefix(params.ethAddress!)
    );
  }

  await claimFaucetForCkbAddress(depositAddress);
}
