import { Address, HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network, testnetNetworks } from '../config';
import { privateKeyToDerivedAccounts } from '../utils/derived';
import { claimForL2 } from './claim-l2';
import { addHexPrefix } from '../utils/address';

export default function setupBatchClaimForL2(program: Command) {
  program
    .command('batch-claim-l2')
    .description('claim faucet for L2 derived accounts based on a private-key')
    .requiredOption('-p, --private-key <HEX_STRING>', 'ckb private key')
    .option('-c, --derived-count <INT>', 'amount of derived accounts to use', '30')
    .option('-c --ckb-address <ADDRESS>', 'ckb deposit-from address')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(testnetNetworks)
        .default(Network.TestnetV1)
    )
    .action(batchClaimForL2)
  ;
}

export async function batchClaimForL2(params: {
  privateKey: HexString;
  derivedCount: string;
  network: Network;
  ckbAddress?: Address;
}) {
  const derivedCount = Number(params.derivedCount);
  if (Number.isNaN(derivedCount) || derivedCount < 1) {
    throw new Error(`derivedCount cannot be smaller than 1, current value: ${params.derivedCount}`);
  }

  const accounts = privateKeyToDerivedAccounts(addHexPrefix(params.privateKey), derivedCount);
  for await (const [index, account] of accounts.entries()) {
    console.log(`[batch-claim-l2] Claiming for account #${index}`);
    await claimForL2({
      privateKey: account.privateKey,
      ckbAddress: params.ckbAddress,
      network: params.network,
    });
    if (index + 1 < accounts.length) {
      console.log('---');
    }
  }

  console.log('---');
  console.log('[batch-claim-l2] Completed');
}
