import 'dotenv/config';
import { Command } from 'commander';
import deposit from './commands/deposit';
import withdraw from './commands/withdraw';
import batchDeposit from './commands/batch-deposit';
import batchWithdraw from './commands/batch-withdraw';
import getBalance from './commands/get-balance';
import findTypeScript from './commands/find-script-tx';

const commands = [
  deposit,
  withdraw,
  batchDeposit,
  batchWithdraw,
  getBalance,
  findTypeScript,
];

(async function main() {
  const program = new Command();
  program.version('1.0.0');

  commands.forEach(command => {
    command(program);
  });
  
  program.parse();
})();
