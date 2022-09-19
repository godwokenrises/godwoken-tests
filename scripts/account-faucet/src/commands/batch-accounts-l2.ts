import { Address, HexString } from '@ckb-lumos/base';
import { Command, Option } from 'commander';
import { Network, networks } from '../config';
import { GodwokenWeb3 } from '../godwoken/web3';
import { privateKeyToDerivedAccounts } from '../faucet/derived';
import { privateKeyToLayer2DepositAddress, toHexString } from '../faucet/address';

export default function setupBatchAccountsForL1(program: Command) {
  program
    .command('batch-accounts-l2')
    .description('get L2 derived accounts based on a private-key')
    .requiredOption('-p, --private-key <HEX_STRING>', 'ckb private key')
    .option('-c, --derived-count <INT>', 'amount of derived accounts to use', '30')
    .option('-c --ckb-address <ADDRESS>', 'ckb deposit-from address')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.AlphanetV1)
    )
    .action(batchAccountsForL2)
  ;
}

export async function batchAccountsForL2(params: {
  privateKey: HexString;
  derivedCount: string;
  network: Network;
  ckbAddress?: Address;
}) {
  const derivedCount = Number(params.derivedCount);
  if (Number.isNaN(derivedCount) || derivedCount < 1) {
    throw new Error(`derivedCount cannot be smaller than 1, current value: ${params.derivedCount}`);
  }

  const config = networks[params.network];
  const gw = new GodwokenWeb3(config.rpc);
  const accounts = privateKeyToDerivedAccounts(toHexString(params.privateKey), derivedCount);

  for (const [index, account] of accounts.entries()) {
    const ckbAddress = await privateKeyToLayer2DepositAddress(config, gw, toHexString(params.privateKey));
    console.log(`[batch-accounts-l2] #${index} private-key: ${account.privateKey}`);
    console.log(`[batch-accounts-l2] #${index} eth-address: ${account.ethAddress}`);
    console.log(`[batch-accounts-l2] #${index} ckb-address: ${ckbAddress}`);
    if (index + 1 < accounts.length) {
      console.log('---');
    }
  }
}
