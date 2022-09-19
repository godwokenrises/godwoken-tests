import 'dotenv/config';
import { Command } from 'commander';
import settings from '../package.json';

// for general usages
import deposit from './commands/deposit';
import withdraw from './commands/withdraw';
import getBalance from './commands/get-balance';
import getTokenBalance from './commands/get-token-balance';
import findTypeScript from './commands/find-script-tx';
import deploySudtErc20Proxy from './commands/deploy-sudt-erc20-proxy';
// for testing only
import testCatch from './commands/batch-prepare';
import batchPrepare from './commands/test-catch';
import batchTransactions from './commands/batch-transactions';

const commands = [
  deposit,
  withdraw,
  getBalance,
  getTokenBalance,
  findTypeScript,
  deploySudtErc20Proxy,

  testCatch,
  batchPrepare,
  batchTransactions,
];

(async function main() {
  const program = new Command();
  program.version(settings.version);

  commands.forEach(command => {
    command(program);
  });
  
  program.parse();
})();
