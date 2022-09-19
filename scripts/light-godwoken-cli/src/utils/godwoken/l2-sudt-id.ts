import { HexString, utils } from '@ckb-lumos/base';
import { Godwoker } from '@polyjuice-provider/base';
import { LightGodwokenConfig } from 'light-godwoken';
import { createSudtTypeScript } from '../ckb/sudt';

export async function getL2SudtAccountId(sudtTypeArgs: HexString, config: LightGodwokenConfig) {
  const rollupConfig = config.layer2Config.ROLLUP_CONFIG;
  const godwoker = new Godwoker(
    config.layer2Config.GW_POLYJUICE_RPC_URL,
    {
      godwoken: {
        rollup_type_hash: rollupConfig.rollup_type_hash,
        eth_account_lock: {
          code_hash: config.layer2Config.SCRIPTS.eth_account_lock.script_type_hash,
          hash_type: "type",
        },
      },
    }
  );

  const sudtTypeScript = createSudtTypeScript(sudtTypeArgs, config);
  const sudtScriptHash = utils.computeScriptHash(sudtTypeScript);

  const scriptHash = await godwoker.getScriptHashByAccountId(1);
  const script = await godwoker.getScriptByScriptHash(scriptHash);

  const layer2SudtScript = {
    code_hash: script.code_hash,
    hash_type: script.hash_type,
    args: rollupConfig.rollup_type_hash + sudtScriptHash.slice(2),
  };
  const layer2SudtScriptHash = utils.computeScriptHash(layer2SudtScript);

  try {
    const sudtId = await godwoker.getAccountIdByScriptHash(layer2SudtScriptHash);
    return parseInt(sudtId, 16);
  } catch (error) {
    return null;
  }
}
