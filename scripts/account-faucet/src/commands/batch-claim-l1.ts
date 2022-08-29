import { HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network } from '../config';
import { privateKeyToDerivedAccounts } from '../utils/derived';
import { claimForL1 } from './claim-l1';
import { addHexPrefix } from '../utils/address';

export default function setupBatchClaimForL1(program: Command) {
  program
    .command('batch-claim-l1')
    .description('claim faucet for L1 derived accounts based on a private-key')
    .requiredOption('-p, --private-key <HEX_STRING>', 'ckb private key')
    .option('-c, --derived-count <INT>', 'amount of derived accounts to use', '30')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(batchClaimForL1)
  ;
}

export async function batchClaimForL1(params: {
  privateKey: HexString;
  derivedCount: string;
  network: Network;
}) {
  const derivedCount = Number(params.derivedCount);
  if (Number.isNaN(derivedCount) || derivedCount < 1) {
    throw new Error(`derivedCount cannot be smaller than 1, current value: ${params.derivedCount}`);
  }

  const accounts = privateKeyToDerivedAccounts(addHexPrefix(params.privateKey), derivedCount);
  for await (const [index, account] of accounts.entries()) {
    console.log(`[batch-claim-l1] Claiming for account #${index}`);
    await claimForL1({
      privateKey: account.privateKey,
      network: params.network,
    });
    if (index + 1 < accounts.length) {
      console.log('---');
    }
  }

  console.log('---');
  console.log('[batch-claim-l1] Completed');
}
