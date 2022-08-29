import { Command, Option } from 'commander';
import { Network } from '../config';
import { deposit } from './deposit';
import { privateKeyToDerivedAccounts } from '../utils/account';

export default function setupBatchDeposit(program: Command) {
  program
    .command('batch-deposit')
    .description('Get derived accounts from --private-key and deposit their capacity from L1 to L2')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .requiredOption('-c, --capacity <STRING>', 'deposit capacity (1:1CKB)')
    .option('-dc, --derived-count <INT>', 'amount of derived accounts to use', '10')
    .option('-sl, --sudt-lock-args <HEX_STRING>', 'deposit sudt L1 lock_args')
    .option('-sa, --sudt-amount <STRING>', 'deposit sudt amount')
    .option('-sd, --sudt-decimals <STRING>', 'sudt decimals')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(batchDeposit)
  ;
}

export async function batchDeposit(params: {
  privateKey: string;
  network: Network;
  capacity: string;
  derivedCount: string;
  sudtLockArgs?: string;
  sudtAmount?: string;
  sudtDecimals?: string;
}) {
  const derivedCount = Number(params.derivedCount);
  if (Number.isNaN(derivedCount) || derivedCount < 1) {
    throw new Error(`derivedCount cannot be smaller than 1, current value: ${params.derivedCount}`);
  }

  const accounts = privateKeyToDerivedAccounts(params.privateKey, derivedCount);
  const results = await Promise.all(
    accounts.map((account, index) => {
      return (async() => {
        try {
          console.debug(`[batch-deposit] depositing for account #${index}`);
          return await deposit({
            ...params,
            privateKey: account.privateKey,
          });
        } catch(e: any) {
          console.log(`[batch-deposit] failed to deposit for account #${index}: ${e.message}`);
          return e.message as string;
        }
      })();
    })
  );

  console.debug('---');
  console.debug(`[batch-deposit] summary of results:`);
  results.forEach((result, index) => {
    console.debug(`#${index} (${accounts[index].ethAddress}) - ${result}`);
  });
}
