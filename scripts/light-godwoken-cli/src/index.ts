import 'dotenv/config';
import { Command } from 'commander';
import deposit from './commands/deposit';
import withdraw from './commands/withdraw';
import transfer from './commands/transfer';
import getBalance from './commands/get-balance';
import findTypeScript from './commands/find-script-tx';

const commands = [
  deposit,
  withdraw,
  transfer,
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
