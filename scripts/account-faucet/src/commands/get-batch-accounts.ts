import { HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network, networks, testnetNetworks } from '../config';
import { GodwokenWeb3 } from '../godwoken/web3';
import { privateKeyToDerivedAccounts } from '../utils/derived';
import { privateKeyToLayer2DepositAddress, privateKeyToOmniCkbAddress, addHexPrefix } from '../utils/address';

export default function setupBatchAccountsForL1(program: Command) {
  program
    .command('get-batch-accounts')
    .description('get derived accounts based on a private-key')
    .requiredOption('-p, --private-key <HEX_STRING>', 'ckb private key')
    .option('-c, --derived-count <INT>', 'amount of derived accounts to use', '30')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(testnetNetworks)
        .default(Network.AlphanetV1)
    )
    .action(batchAccountsForL2)
  ;
}

export async function batchAccountsForL2(params: {
  privateKey: HexString;
  derivedCount: string;
  network: Network;
}) {
  const derivedCount = Number(params.derivedCount);
  if (Number.isNaN(derivedCount) || derivedCount < 1) {
    throw new Error(`derivedCount cannot be smaller than 1, current value: ${params.derivedCount}`);
  }

  const config = networks[params.network];
  const rpc = new GodwokenWeb3(config.rpc);
  const accounts = privateKeyToDerivedAccounts(addHexPrefix(params.privateKey), derivedCount);

  for (const [index, account] of accounts.entries()) {
    const ckbOmniAddress = privateKeyToOmniCkbAddress(addHexPrefix(account.privateKey), config);
    const depositAddress = await privateKeyToLayer2DepositAddress(config, rpc, addHexPrefix(params.privateKey));
    console.log(`[batch-accounts] index: ${index}`);
    console.log(`[batch-accounts] private-key: ${account.privateKey}`);
    console.log(`[batch-accounts] eth-address: ${account.ethAddress}`);
    console.log(`[batch-accounts] l1-omni-address: ${ckbOmniAddress}`);
    console.log(`[batch-accounts] l1-deposit-address: ${depositAddress}`);
    if (index + 1 < accounts.length) {
      console.log('---');
    }
  }
}
