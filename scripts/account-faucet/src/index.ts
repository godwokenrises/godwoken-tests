import { Command } from 'commander';
import settings from '../package.json';
import claimL1 from './commands/claim-l1';
import claimL2 from './commands/claim-l2';
import batchClaimL1 from './commands/batch-claim-l1';
import batchClaimL2 from './commands/batch-claim-l2';
import batchAccountsL1 from './commands/batch-accounts-l1';
import batchAccountsL2 from './commands/batch-accounts-l2';
import getL2Address from './commands/get-l2-address';

const commands = [
  claimL1,
  batchClaimL1,
  batchAccountsL1,
  claimL2,
  batchClaimL2,
  batchAccountsL2,
  getL2Address,
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
