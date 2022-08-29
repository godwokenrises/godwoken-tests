import { Command } from 'commander';
import claimL1 from './commands/claim-l1';
import claimL2 from './commands/claim-l2';
import batchClaimL1 from './commands/batch-claim-l1';
import batchAccountsL1 from './commands/batch-accounts-l1';
import getL2Address from './commands/get-l2-address';

const commands = [
  claimL1,
  batchClaimL1,
  batchAccountsL1,
  claimL2,
  getL2Address,
];

async function main() {
  const program = new Command();
  program.version('1.0.0');

  commands.forEach(command => {
    command(program);
  });
  
  program.parse();
}

main();
