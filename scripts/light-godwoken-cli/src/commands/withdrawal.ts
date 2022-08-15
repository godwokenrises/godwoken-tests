import 'dotenv/config';
import { Command } from 'commander';
import { BigNumber, utils } from 'ethers';
import { Network, networks } from '../config';
import { createLightGodwoken } from '../utils';

export default function setupWithdrawal(program: Command) {
  program
    .command('withdrawal')
    .description('Withdrawal capacity from Godwoken layer2 to layer1')
    .requiredOption('-p, --privateKey <privateKey>', '[string] CKB private key')
    .requiredOption('-c, --capacity <capacity>', '[string] deposit capacity (1:1CKB)')
    .option('-n, --network <network>', '[v0|v1] network name', Network.TestnetV1)
    .action(withdrawal);
}

export async function withdrawal(params: {
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
  const result = await lightGodwokenV1.withdrawWithEvent({
    capacity: capacity.toHexString(),
    amount: '0x0',
    sudt_script_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  });

  return new Promise<void>((resolve, reject) => {
    result.on('sent', (tx) => {
      console.debug('withdrawal-tx: ', tx);
      resolve();
    });
    result.on('fail', (error) => {
      console.debug('withdrawal failed: ', error.message);
      reject(error);
    });
  });
}
