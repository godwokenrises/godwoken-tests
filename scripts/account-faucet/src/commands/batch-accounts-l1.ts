import { HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network, networks } from '../config';
import { privateKeyToOmniCkbAddress } from '../faucet/address';
import { privateKeyToDerivedAccounts } from '../faucet/derived';

export default function setupBatchAccountsForL1(program: Command) {
  program
    .command('batch-accounts-l1')
    .description('get L1 derived accounts based on a private-key')
    .requiredOption('-p, --private-key <HEX_STRING>', 'ckb private key')
    .option('-c, --derived-count <INT>', 'amount of derived accounts to use', '10')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(batchAccountsForL1)
  ;
}

export async function batchAccountsForL1(params: {
  privateKey: HexString;
  derivedCount: string;
  network: Network;
}) {
  const derivedCount = Number(params.derivedCount);
  if (Number.isNaN(derivedCount) || derivedCount < 1) {
    throw new Error(`derivedCount cannot be smaller than 1, current value: ${params.derivedCount}`);
  }

  const config = networks[params.network];
  const accounts = privateKeyToDerivedAccounts(params.privateKey, derivedCount);

  for (const [index, account] of accounts.entries()) {
    const ckbAddress = privateKeyToOmniCkbAddress(account.privateKey, config);
    console.log(`[batch-accounts-l1] #${index} private-key: ${account.privateKey}`);
    console.log(`[batch-accounts-l1] #${index} eth-address: ${account.ethAddress}`);
    console.log(`[batch-accounts-l1] #${index} ckb-address: ${ckbAddress}`);
    if (index + 1 < accounts.length) {
      console.log('---');
    }
  }
}
