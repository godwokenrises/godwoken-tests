import { Command } from 'commander';
import { setupFaucetCommand } from './faucet/command';

async function main() {
  const program = new Command();
  program.version('1.0.0');

  // faucet
  setupFaucetCommand(program);
  
  program.parse();
}

main();