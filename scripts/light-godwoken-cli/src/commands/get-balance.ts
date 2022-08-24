import { Command, Option } from 'commander';
import { utils } from 'ethers';
import { Network } from '../config';
import { getConfig } from '../utils/config';
import { createLightGodwoken } from '../utils/client';

export default function setupGetBalance(program: Command) {
  program
    .command('get-balance')
    .option('-p, --private-key <HEX_STRING>', 'account private key')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(getBalance)
  ;
}

export async function getBalance(params: {
  privateKey: string;
  network: Network;
}) {
  const network = getConfig(params.network);
  const client = await createLightGodwoken({
    privateKey: params.privateKey,
    rpc: network.rpc,
    network: network.network,
    version: network.version,
    config: network.lightGodwokenConfig,
  });

  const l1 = await client.getL1CkbBalance();
  const l2 = await client.getL2CkbBalance();
  const balances = {
    l1: `${utils.formatUnits(l1, 8)} CKB`,
    l2: `${utils.formatUnits(l2)} pCKB`,
  };

  console.debug(balances);
}
