import { Command, Option } from 'commander';
import { Network } from '../config';
import { withdraw } from './withdraw';
import { privateKeyToDerivedAccounts } from '../utils/account';

export default function setupBatchWithdraw(program: Command) {
  program
    .command('batch-withdraw')
    .description('Get derived accounts from --private-key and withdraw their capacity from L2 to L1')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .requiredOption('-c, --capacity <STRING>', 'withdraw capacity (1:1CKB)')
    .option('-dc, --derived-count <INT>', 'amount of derived accounts to use', '10')
    .option('-sl, --sudt-lock-args <HEX_STRING>', 'withdraw sudt l1 lock_args')
    .option('-sa, --sudt-amount <STRING>', 'withdraw sudt amount')
    .option('-sd, --sudt-decimals <STRING>', 'sudt decimals')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(batchWithdraw)
  ;
}

export async function batchWithdraw(params: {
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
      return (async () => {
        try {
          console.debug(`[batch-withdraw] withdrawing for account #${index}`);
          return await withdraw({
            ...params,
            privateKey: account.privateKey,
          });
        } catch(e: any) {
          console.log(`[batch-withdraw] failed to withdraw for account #${index}: ${e.message}`);
          return e.message as string;
        }
      })();
    })
  );

  console.debug('---');
  console.debug(`[batch-withdraw] withdrawals have a delay (check it after 5 minutes)`);
  console.debug(`[batch-withdraw] summary of results:`);
  results.forEach((result, index) => {
    console.debug(`#${index} (${accounts[index].ethAddress}) - ${result}`);
  });
}
