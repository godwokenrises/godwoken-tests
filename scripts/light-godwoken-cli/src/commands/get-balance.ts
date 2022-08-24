import { Command, Option } from 'commander';
import { utils } from 'ethers';
import { Network } from '../config';
import { getConfig } from '../utils/config';
import { createLightGodwoken } from '../utils/client';

export default function setupGetBalance(program: Command) {
  program
    .command('get-balance')
    .argument('<PRIVATE_KEY>', 'account private key')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(getBalance)
  ;
}

export async function getBalance(privateKey: string, params: {
  network: Network;
}) {
  const network = getConfig(params.network);
  const client = await createLightGodwoken({
    privateKey: privateKey,
    rpc: network.rpc,
    network: network.network,
    version: network.version,
    config: network.lightGodwokenConfig,
  });

  const l1 = await client.getL1CkbBalance();
  const l2 = await client.getL2CkbBalance();
  console.debug({
    l1: utils.formatUnits(l1, 8),
    l2: utils.formatUnits(l2),
  });
}
