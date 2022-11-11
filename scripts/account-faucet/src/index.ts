import { Command } from 'commander';
import settings from '../package.json';
import claimL1 from './commands/claim-l1';
import claimL2 from './commands/claim-l2';
import getL2Address from './commands/get-l2-address';
import batchClaimL1 from './commands/batch-claim-l1';
import batchClaimL2 from './commands/batch-claim-l2';
import getBatchAccounts from './commands/get-batch-accounts';

const commands = [
  claimL1,
  claimL2,
  getL2Address,
  batchClaimL1,
  batchClaimL2,
  getBatchAccounts,
];

async function main() {
  const program = new Command();
  program.version(settings.version);

  commands.forEach(command => {
    command(program);
  });
  
  program.parse();
}

main();
