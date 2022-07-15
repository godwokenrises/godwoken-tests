import { Command } from 'commander';
import { setupCalculateLayer2AddressCommand, setupFaucetCommand } from './faucet/command';

async function main() {
  const program = new Command();
  program.version('1.0.0');

  // faucet
  setupFaucetCommand(program);
  // calculate layer 2 deposit address
  setupCalculateLayer2AddressCommand(program);
  
  program.parse();
}

main();