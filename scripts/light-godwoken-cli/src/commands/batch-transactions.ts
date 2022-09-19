import { Command, Option } from 'commander';
import { Address, HexString } from '@ckb-lumos/base';
import { Network, networks } from '../config';
import { deposit } from './deposit';
import { withdraw } from './withdraw';
import { createLightGodwoken } from '../utils/client';
import { absolutePath, writeJson } from '../utils/file';
import { mustBeInteger, toHexString } from '../utils/format';
import { createRacePromise, retryIfFailed } from '../utils/async';
import { DerivedAccount, privateKeyToDerivedAccounts } from '../utils/account';
import { getBlockNumber, waitTillBlockNumber } from '../utils/godwoken/rpc';

export default function setupBatchDeposit(program: Command) {
  program
    .command('batch-transactions')
    .description('Send deposit&withdraw transactions at certain intervals')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .option('--capacity <STRING>', 'deposit capacity (1:1CKB)', '400')
    .option('--derived-count <INT>', 'amount of derived accounts to use', '30')
    .option('--sudt-lock-args <HEX_STRING>', 'deposit sudt L1 lock_args', '0x5c7253696786b9eddd34e4f6b6e478ec5742bd36569ec60c1d0487480ba4f9e3')
    .option('--sudt-amount <STRING>', 'deposit sudt amount', '0.01')
    .option('--sudt-decimals <STRING>', 'sudt decimals', '8')
    .option('--duration <INT>', 'how long to keep sending transactions (minutes)', '60')
    .option('--start-time <INT>', 'the actual workflow started time (milliseconds)', `${Date.now()}`)
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.AlphanetV1)
    )
    .action(batchTransactions)
  ;
}

export interface BatchTransactionsParams {
  network: Network;
  privateKey: string;
  capacity: string;
  derivedCount: string;
  sudtLockArgs: string;
  sudtAmount: string;
  sudtDecimals: string;
  duration: string;
  startTime: string;
}
export interface BatchTransactionRound {
  round: number;
  timestamp: number;
  blockNumber: number;
  deposits: {
    total: number;
    succeed: number;
    failed: number;
    history: BatchTransactionResult[];
  };
  withdrawals: {
    total: number;
    succeed: number;
    failed: number;
    history: BatchTransactionResult[];
  };
}
export interface BatchTransactionResult {
  ethAddress: Address;
  success: boolean;
  txHash?: HexString;
  error?: Error | string;
}
export interface UncaughtErrorReport {
  origin: NodeJS.UncaughtExceptionListener;
  error: Error;
}

export async function batchTransactions(params: BatchTransactionsParams) {
  const duration = mustBeInteger(params.duration, 'duration') * 60 * 1000;
  const derivedCount = mustBeInteger(params.derivedCount, 'derivedCount');
  const accounts = privateKeyToDerivedAccounts(toHexString(params.privateKey), derivedCount);
  const accountEthAddresses = accounts.map((account) => account.ethAddress);

  console.log('[batch-transactions] accounts:', accountEthAddresses);

  const config = networks[params.network];
  const mainAccountClient = await retryIfFailed(
    async () => await createLightGodwoken({
      privateKey: params.privateKey,
      rpc: config.rpc,
      network: config.network,
      version: config.version,
      config: config.lightGodwokenConfig,
    }),
    10,
    50,
  );

  const startBlockNumber = await retryIfFailed(
    async () => await getBlockNumber(config.rpc),
    10,
    50,
  );

  const start = mustBeInteger(params.startTime, 'startTime');
  const end = start + duration;
  const promises = [];

  const uncaughtErrors: UncaughtErrorReport[] = [];
  function onUncaughtException(error: Error, origin: NodeJS.UncaughtExceptionListener) {
    console.error('[batch-transactions] uncaught exception: ', origin, error);
    uncaughtErrors.push({
      origin,
      error,
    });
  }

  // prevent crashes with uncaught exceptions
  process.on('uncaughtException', onUncaughtException);
  console.log(`[batch-transactions] started at ${start}, will end at ${end}`);

  let blockNumber = startBlockNumber;
  let now = start;
  let round = 1;
  let accountIndex = 0;
  let accountLoopRound = 0;
  while(now < end) {
    if (accountIndex >= accounts.length) {
      accountIndex = 0;
      accountLoopRound++;
    }

    try {
      console.log(`[batch-transactions] new round: ${round}, blockNumber: ${blockNumber}, accountIndex: ${accountIndex}`);
      promises.push(batchTransactionRound({
        round,
        params,
        blockNumber,
        timestamp: now,
        accounts: [accounts[accountIndex]],
      }));
    } catch (e) {
      console.log(`[batch-transactions] encountered error while running batch-round: ${round}, blockNumber: ${blockNumber}`);
      console.error(e);
    }

    try {
      console.log(`[batch-transactions] waiting for blockNumber: ${blockNumber}`);
      blockNumber = await waitTillBlockNumber(config.rpc, blockNumber + 1);
    } catch (e) {
      console.log(`[batch-transactions] encountered error while waiting for next blockNumber: ${blockNumber}`);
      console.error(e);
    }

    round++;
    accountIndex++;
    now = Date.now();
  }

  console.log('[batch-transactions] waiting all rounds to complete');
  const results = await Promise.all(promises);

  console.log(`[batch-transactions] all rounds completed, calculating result, round: ${round} timestamp: ${Date.now()}`);
  const batchResult = results.reduce((result, round) => {
    result.succeedDeposits += round.deposits.succeed;
    result.failedDeposits += round.deposits.failed;
    result.succeedWithdrawals += round.withdrawals.succeed;
    result.failedWithdrawals += round.withdrawals.failed;
    return result;
  }, {
    succeedDeposits: 0,
    failedDeposits: 0,
    succeedWithdrawals: 0,
    failedWithdrawals: 0,
  });

  const { succeedDeposits, failedDeposits, succeedWithdrawals, failedWithdrawals } = batchResult;
  const totalDeposits = succeedDeposits + failedDeposits;
  const totalWithdrawals = succeedWithdrawals + failedWithdrawals;
  const totalTransactions = totalDeposits + totalWithdrawals;

  const summaryTime = Date.now();
  const summary = {
    mainAccountEthAddress: mainAccountClient.provider.getL2Address(),
    derivedAccountEthAddresses: accountEthAddresses,

    fromBlockNumber: startBlockNumber,
    toBlockNumber: blockNumber,
    blockLength: blockNumber - startBlockNumber,

    fromTimestamp: start,
    toTimestamp: summaryTime,
    duration: summaryTime - start,

    uncaughtErrors,
    rounds: results,
    lastAccountIndex: accountIndex,
    accountLoopRounds: accountLoopRound,

    totalResult: {
      total: totalTransactions,
      succeed: succeedDeposits + succeedWithdrawals,
      failed: failedDeposits + failedWithdrawals,
      successRate: `${((succeedDeposits + succeedWithdrawals) / totalTransactions * 100).toFixed(2)}%`,
      failRate: `${((failedDeposits + failedWithdrawals) / totalTransactions * 100).toFixed(2)}%`,
    },
    depositResult: {
      total: succeedDeposits + failedDeposits,
      succeed: succeedDeposits,
      failed: failedDeposits,
      successRate: `${(succeedDeposits / totalDeposits * 100).toFixed(2)}%`,
      failRate: `${(failedDeposits / totalDeposits * 100).toFixed(2)}%`,
    },
    withdrawalResult: {
      total: succeedWithdrawals + failedWithdrawals,
      succeed: succeedWithdrawals,
      failed: failedWithdrawals,
      successRate: `${(succeedWithdrawals / totalWithdrawals * 100).toFixed(2)}%`,
      failRate: `${(failedWithdrawals / totalWithdrawals * 100).toFixed(2)}%`,
    },
  };

  const artifactsActualPath = await writeJson(
    absolutePath(`./artifacts/batch-transactions-[${summary.fromBlockNumber}-${summary.toBlockNumber}].json`),
    summary
  );

  console.log('---');
  console.log(`[batch-transactions] all rounds ends, and the summary is generated at ${artifactsActualPath}`);
  console.log(`[batch-transactions] here's the summary:`);
  console.log(JSON.stringify(summary, null, 2));

  process.off('uncaughtException', onUncaughtException);
  process.exit(0);
}

async function batchTransactionRound(props: {
  params: BatchTransactionsParams,
  accounts: DerivedAccount[],
  blockNumber: number,
  timestamp: number,
  round: number,
}): Promise<BatchTransactionRound> {
  const { params, accounts, blockNumber, timestamp, round } = props;
  const depositPromises = accounts.map(async (account, index) => {
    return createRacePromise<BatchTransactionResult>({
      expect: async () => {
        try {
          const result = await deposit({
            ...params,
            privateKey: account.privateKey,
            waitFor: 'sent',
          });

          return {
            ethAddress: account.ethAddress,
            success: true,
            txHash: result,
          };
        } catch (e) {
          console.log(`[batch-transactions] encountered error while depositing in round: ${round}, index: ${index}`, e);
          return {
            ethAddress: account.ethAddress,
            success: false,
            error: (e as Error).toString(),
          };
        }
      },
      onTimeout: () => {
        console.error(`[batch-transactions] deposit not completed within 3 minutes, blockNumber: ${blockNumber}, accountAddress: ${account.ethAddress}`);
        return {
          ethAddress: account.ethAddress,
          success: false,
          error: new Error(`deposit not completed within 3 minutes, maybe some uncaught exception is blocking the process`).toString(),
        };
      },
      wait: 3 * 60 * 1000,
    });
  });
  const withdrawalPromises = accounts.map(async (account, index) => {
    return createRacePromise<BatchTransactionResult>({
      expect: async () => {
        try {
          return {
            ethAddress: account.ethAddress,
            success: true,
            txHash: await withdraw({
              ...params,
              privateKey: account.privateKey,
            }),
          };
        } catch (e) {
          console.log(`[batch-transactions] encountered error while withdrawing in round: ${round}, index: ${index}`, e);
          return {
            ethAddress: account.ethAddress,
            success: false,
            error: (e as Error).toString(),
          };
        }
      },
      onTimeout: () => {
        console.error(`[batch-transactions] withdrawal not completed within in 3 minutes, blockNumber: ${blockNumber}, accountAddress: ${account.ethAddress}`);
        return {
          ethAddress: account.ethAddress,
          success: false,
          error: new Error(`withdrawal not completed within 3 minutes, maybe some uncaught exception is blocking the process`).toString(),
        };
      },
      wait: 3 * 60 * 1000,
    });
  });

  console.log(`[batch-transactions] requests generated, blockNumber: ${blockNumber}, timestamp: ${timestamp}`);
  const [deposits, withdrawals] = await Promise.all([
    Promise.all(depositPromises),
    Promise.all(withdrawalPromises),
  ]);
  const depositResult = countTransactionsResult(deposits);
  const withdrawalResult = countTransactionsResult(withdrawals);

  console.log(`[batch-transactions] #${blockNumber} has a result`);

  return {
    round,
    timestamp,
    blockNumber,
    deposits: {
      total: deposits.length,
      succeed: depositResult[0],
      failed: depositResult[1],
      history: deposits,
    },
    withdrawals: {
      total: withdrawals.length,
      succeed: withdrawalResult[0],
      failed: withdrawalResult[1],
      history: withdrawals,
    },
  };
}

function countTransactionsResult(results: BatchTransactionResult[]): [number, number] {
  return results.reduce((numbers, result) => {
    if (result.success) numbers[0]++;
    else numbers[1]++;
    return numbers;
  }, [0, 0]);
}
