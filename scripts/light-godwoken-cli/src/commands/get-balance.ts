import { Command, Option } from 'commander';
import { utils } from 'ethers';
import { Network } from '../config';
import { getConfig } from '../utils/config';
import { createLightGodwoken } from '../utils/client';

export default function setupGetBalance(program: Command) {
  program
    .command('get-balance')
    .description('get account L1/L2 balances by --private-key')
    .argument('<HEX_STRING>', 'account private key')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(async (...args: Parameters<typeof getBalance>) => {
      await getBalance(...args);
    })
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
  const result = {
    l1Address: client.provider.getL1Address(),
    l1Balance: utils.formatUnits(l1, 8),
    l2Address: client.provider.getL2Address(),
    l2Balance: utils.formatEther(l2),
  };

  console.debug(`l1-address: ${result.l1Address}`);
  console.debug(`l1-balance: ${result.l1Balance}`);
  console.debug(`l2-address: ${result.l2Address}`);
  console.debug(`l2-balance: ${result.l2Balance}`);
  return result;
}
