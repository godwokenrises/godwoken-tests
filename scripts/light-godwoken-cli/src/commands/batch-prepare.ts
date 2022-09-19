import { Command, Option } from 'commander';
import { utils } from 'ethers';
import { BI, Transaction } from '@ckb-lumos/lumos';
import { HexString, Script } from '@ckb-lumos/base';
import { encodeToAddress } from '@ckb-lumos/helpers';
import { initializeConfig, ScriptConfig } from '@ckb-lumos/config-manager';
import { AcpTransferSudtBuilder, CkitProvider, predefined, RecipientOption } from '@ckitjs/ckit';
import { Secp256k1Signer } from '@ckitjs/ckit/dist/wallets/Secp256k1Wallet';
import { Network, NetworkConfig, networks } from '../config';
import { createSudtTypeScript } from '../utils/ckb/sudt';
import { createLightGodwokenByNetworkConfig } from '../utils/client';
import { privateKeyToBlake160Address } from '../utils/ckb/blake160';
import { DerivedAccount, privateKeyToDerivedAccounts } from '../utils/account';
import { mustBeInteger, toHexString } from '../utils/format';
import { getL2SudtAccountId } from '../utils/godwoken/l2-sudt-id';
import { absolutePath, writeJson } from '../utils/file';
import { LightGodwokenConfig } from '../libraries/light-godwoken';

export default function setupBatchPrepare(program: Command) {
  program
    .command('batch-prepare')
    .description('Prepare accounts for the batch-transaction command')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .option('--derived-count <INT>', 'amount of derived accounts to use', '30')
    .option('--from-private-key <HEX_STRING>', 'which account to transfer sudt from', '0x79682c20bbcaf7fcf18eb0c69b133c872227ceb88971090e7f2242c80cd54d18')
    .option('--sudt-lock-args <HEX_STRING>', 'transfer sudt L1 lock_args', '0x5c7253696786b9eddd34e4f6b6e478ec5742bd36569ec60c1d0487480ba4f9e3')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.AlphanetV1)
    )
    .action(prepareForBatch)
  ;
}

type TransactionResult = {
  txHash?: string;
  tx?: Transaction | null;
  success: boolean;
  error?: string;
};

export async function prepareForBatch(params: {
  network: Network;
  privateKey: string;
  derivedCount: string;
  sudtLockArgs: HexString;
  fromPrivateKey: HexString;
}) {
  const network = networks[params.network];
  const client = await createLightGodwokenByNetworkConfig(params.privateKey, network);

  const config = client.getConfig();
  initializeConfig(config.lumosConfig);

  const fromPrivateKey = toHexString(params.fromPrivateKey);
  const fromAddress = privateKeyToBlake160Address(fromPrivateKey, config.lumosConfig);
  const derivedAccounts = privateKeyToDerivedAccounts(
    toHexString(params.privateKey),
    mustBeInteger(params.derivedCount, 'derivedCount')
  );

  const sudt = createSudtTypeScript(params.sudtLockArgs, config);
  const l2SudtId = await getL2SudtAccountId(params.sudtLockArgs, config);
  const transferSudtAmount = utils.parseUnits('1000', 8).toString();

  console.log('l2-sudt-id:', l2SudtId);
  console.log('from-address:', fromAddress);
  console.log('transfer-sudt-amount:', transferSudtAmount);

  // 1. transfer SUDT to derived L1 accounts
  const sudtTransferResult = await transferSudtToDerivedAccounts({
    sudt,
    config,
    network,
    derivedAccounts,
    fromPrivateKey,
    amount: transferSudtAmount,
  });

  // 2. deposit SUDT to derived L2 accounts
  const sudtDepositResult = await depositSudtToDerivedAccounts({
    sudt,
    config,
    network,
    derivedAccounts,
    fromPrivateKey,
    amount: transferSudtAmount,
  });

  const summary = {
    mainAccountEthAddress: client.provider.getL2Address(),
    derivedAccountEthAddresses: derivedAccounts.map((account) => account.ethAddress),
    fromAddress,
    sudt,
    l2SudtId,
    transferSudtAmount,
    sudtTransferResult,
    sudtDepositResult,
  };

  const artifactsActualPath = await writeJson(
    absolutePath(`./artifacts/batch-prepare-${Date.now()}.json`),
    summary
  );

  console.log('---');
  console.log(`[batch-prepare] all preparation done, and the summary is generated at ${artifactsActualPath}`);
  console.log(`[batch-prepare] here's the summary:`);
  console.log(JSON.stringify(summary, null, 2));
}

async function transferSudtToDerivedAccounts(params: {
  fromPrivateKey: HexString,
  sudt: Script,
  amount: string,
  derivedAccounts: DerivedAccount[],
  config: LightGodwokenConfig,
  network: NetworkConfig,
}) {
  const { fromPrivateKey, derivedAccounts, sudt, amount, config, network } = params;
  const provider = new CkitProvider(config.layer1Config.CKB_INDEXER_URL, config.layer1Config.CKB_RPC_URL);
  await provider.init(predefined.Aggron);

  const secp256k1Script = provider.newScript('SECP256K1_BLAKE160');
  const signer = new Secp256k1Signer(toHexString(fromPrivateKey), provider, secp256k1Script);
  const fromCkbAddress = privateKeyToBlake160Address(toHexString(fromPrivateKey), config.lumosConfig);

  const builder = new AcpTransferSudtBuilder(
    {
      recipients: await Promise.all(
        derivedAccounts.map(async (account) => {
          const accountClient = await createLightGodwokenByNetworkConfig(account.privateKey, network);
          const ckbAddress = accountClient.provider.getL1Address();
          return {
            policy: 'createCell',
            recipient: ckbAddress,
            amount: amount,
            sudt,
          } as RecipientOption;
        })
      ),
    },
    provider,
    fromCkbAddress,
  );

  const unsignedTx = await builder.build();
  const signedTx = await signer.seal(unsignedTx);
  const result: TransactionResult = {
    success: true,
    tx: signedTx,
  };

  try {
    result.txHash = await provider.sendTransaction(signedTx);
    const tx = await provider.waitForTransactionCommitted(result.txHash);
    if (tx) result.tx = tx;
  } catch (e) {
    result.success = false;
    result.error = (e as Error).toString();
  }

  return result;
}

async function depositSudtToDerivedAccounts(params: {
  fromPrivateKey: HexString,
  sudt: Script,
  amount: string,
  derivedAccounts: DerivedAccount[],
  config: LightGodwokenConfig,
  network: NetworkConfig,
}) {
  const { fromPrivateKey, derivedAccounts, sudt, amount, config, network } = params;
  const provider = new CkitProvider(config.layer1Config.CKB_INDEXER_URL, config.layer1Config.CKB_RPC_URL);

  const depositLock = config.layer2Config.SCRIPTS.deposit_lock;
  const depositScriptConfig: ScriptConfig = {
    CODE_HASH: depositLock.script_type_hash,
    HASH_TYPE: 'type',
    TX_HASH: depositLock.cell_dep.out_point.tx_hash,
    INDEX: depositLock.cell_dep.out_point.index,
    DEP_TYPE: depositLock.cell_dep.dep_type,
  };
  await provider.init({
    ...predefined.Aggron,
    SCRIPTS: {
      ...predefined.Aggron.SCRIPTS,
      // @ts-ignore
      DEPOSIT_LOCK: depositScriptConfig, // ckit has compatibility issue with config types
    },
  });

  const secp256k1Script = provider.newScript('SECP256K1_BLAKE160');
  const signer = new Secp256k1Signer(toHexString(fromPrivateKey), provider, secp256k1Script);
  const fromCkbAddress = privateKeyToBlake160Address(toHexString(fromPrivateKey), config.lumosConfig);

  const builder = new AcpTransferSudtBuilder(
    {
      recipients: await Promise.all(
        derivedAccounts.map(async (account) => {
          const accountClient = await createLightGodwokenByNetworkConfig(account.privateKey, network);
          const depositLock = accountClient.generateDepositLock();
          const depositAddress = encodeToAddress(depositLock, {
            config: config.lumosConfig,
          });

          return {
            policy: 'createCell',
            additionalCapacity: BI.from(77_00000000).toHexString(),
            recipient: depositAddress,
            amount: amount,
            sudt,
          } as RecipientOption;
        })
      ),
    },
    provider,
    fromCkbAddress,
  );

  const unsignedTx = await builder.build();
  const signedTx = await signer.seal(unsignedTx);
  const result: TransactionResult = {
    success: true,
    tx: signedTx,
  };

  try {
    result.txHash = await provider.sendTransaction(signedTx);
    const tx = await provider.waitForTransactionCommitted(result.txHash);
    if (tx) result.tx = tx;
  } catch (e) {
    result.success = false;
    result.error = (e as Error).toString();
  }

  return result;
}
