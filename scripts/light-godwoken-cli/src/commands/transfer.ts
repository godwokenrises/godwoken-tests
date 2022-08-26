import { Command, Option } from 'commander';
import { Network } from '../config';
import { getConfig } from '../utils/config';
import { createLightGodwoken } from '../utils/client';

export default function setupTransfer(program: Command) {
  program
    .command('transfer')
    .option('-p, --private-key <HEX_STRING>', 'account private key')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(transfer)
  ;
}

export async function transfer(params: {
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

  const l1Address = client.provider.getL1Address();
  console.debug(l1Address);
}
