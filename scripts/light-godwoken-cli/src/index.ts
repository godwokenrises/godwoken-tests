import 'dotenv/config';
import { Command } from 'commander';
import settings from '../package.json';

// for general usages
import deposit from './commands/deposit';
import withdraw from './commands/withdraw';
import l1Transfer from './commands/l1-transfer';
import getBalance from './commands/get-balance';
import getTokenBalance from './commands/get-token-balance';
import findTypeScript from './commands/find-script-tx';
import deploySudtErc20Proxy from './commands/deploy-sudt-erc20-proxy';
// generating statistics
import { setupGetLegacyWithdrawalsStats } from './commands/get-legacy-withdrawals-stats';
// for testing only
import testCatch from './commands/test-catch';
import batchPrepareSudt from './commands/batch-prepare-sudt';
import batchCombineSudt from './commands/batch-combine-sudt';
import batchDepositWithdraw from './commands/batch-deposit-withdraw';

const commands = [
  deposit,
  withdraw,
  l1Transfer,
  getBalance,
  getTokenBalance,
  findTypeScript,
  deploySudtErc20Proxy,

  setupGetLegacyWithdrawalsStats,

  testCatch,
  batchPrepareSudt,
  batchCombineSudt,
  batchDepositWithdraw,
];

(async function main() {
  const program = new Command();
  program.version(settings.version);

  commands.forEach(command => {
    command(program);
  });
  
  program.parse();
})();
