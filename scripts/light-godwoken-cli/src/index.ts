import 'dotenv/config';
import { Command } from 'commander';
import deposit from './commands/deposit';
import withdrawal from './commands/withdrawal';

const commands = [
  deposit,
  withdrawal,
];

(async function main() {
  const program = new Command();
  program.version('1.0.0');

  commands.forEach(command => {
    command(program);
  });
  
  program.parse();
})();
