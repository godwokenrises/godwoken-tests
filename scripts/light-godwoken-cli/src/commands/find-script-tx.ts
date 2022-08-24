import { Command } from 'commander';
import { HashType, utils } from '@ckb-lumos/base';
import { Indexer } from '@ckb-lumos/ckb-indexer';
import { devnetConfigV1 } from '../configs/devnet';
import { Network } from '../config';

const config = devnetConfigV1;

export default function setupFindScriptTransaction(program: Command) {
  program
    .command('find-script-tx')
    .option('--code-hash <STRING>', 'Script.code_hash')
    .option('--hash-type <STRING>', 'Script.hash_type')
    .option('--args <STRING>', 'Script.args')
    .option('--script-type <SCRIPT_TYPE>', 'search type, "type" or "lock" (default is "type")', 'type')
    .action(findScriptTransaction)
  ;
}

export async function findScriptTransaction(params: {
  codeHash: string;
  hashType: HashType;
  args: string;
  network: Network;
}) {
  const indexerUrl = config.layer1Config.CKB_INDEXER_URL;
  const rpcUrl = config.layer1Config.CKB_RPC_URL;

  const indexer = new Indexer(indexerUrl, rpcUrl);
  const collect = indexer.collector({
    type: {
      code_hash: params.codeHash,
      hash_type: params.hashType,
      args: params.args,
    }
  });

  const hash = utils.computeScriptHash({
    code_hash: params.codeHash,
    hash_type: params.hashType,
    args: params.args,
  });
  console.log('script_hash: ', hash);

  for await (const cell of collect.collect()) {
    console.log(cell.out_point);
  }
}
