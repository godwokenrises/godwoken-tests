import { Command } from 'commander';
import { utils, BigNumber } from 'ethers';
import { Network, networks } from '../config';
import { createLightGodwoken } from '../utils';

export default function setupDeposit(program: Command) {
  program
    .command('deposit')
    .description('Deposit capacity from layer1 to Godwoken layer2')
    .requiredOption('-p, --privateKey <privateKey>', '[string] CKB private key')
    .requiredOption('-c, --capacity <capacity>', '[string] deposit capacity (1:1CKB)')
    .option('-n, --network <network>', '[v0|v1] network name', Network.TestnetV1)
    .action(deposit);
}

export async function deposit(params: {
  privateKey: string;
  capacity: string;
  network: Network;
}) {
  if (!BigNumber.from(params.capacity)) {
    throw new Error(`Invalid capacity: ${params.capacity}`);
  }
  if (!networks[params.network]) {
    throw new Error(`Network not exist: ${params.network}`);
  }

  const network = networks[params.network];
  const lightGodwokenV1 = await createLightGodwoken(network.version, network.rpc, params.privateKey);

  const capacity = utils.parseUnits(params.capacity, 8);
  const result = await lightGodwokenV1.deposit({
    capacity: capacity.toHexString(),
  });

  console.log('deposit-tx: ', result);
}
