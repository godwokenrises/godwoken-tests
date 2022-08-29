import { HexString, utils } from '@ckb-lumos/base';
import { LightGodwokenConfig } from '../../libraries/light-godwoken';
import { getAccountIdByScriptHash, getScriptByScriptHash, getScriptHashByAccountId } from './rpc';
import { createSudtTypeScript } from '../ckb/sudt';

export async function getL2SudtAccountId(sudtTypeArgs: HexString, config: LightGodwokenConfig) {
  const rollupConfig = config.layer2Config.ROLLUP_CONFIG;
  const rpcUrl = config.layer2Config.GW_POLYJUICE_RPC_URL;

  const sudtTypeScript = createSudtTypeScript(sudtTypeArgs, config);
  const sudtScriptHash = utils.computeScriptHash(sudtTypeScript);

  const scriptHash = await getScriptHashByAccountId(rpcUrl, '0x1');
  const script = await getScriptByScriptHash(rpcUrl, scriptHash);

  const layer2SudtScriptHash = utils.computeScriptHash({
    code_hash: script.code_hash,
    hash_type: script.hash_type,
    args: rollupConfig.rollup_type_hash + sudtScriptHash.slice(2),
  });

  try {
    const sudtId = await getAccountIdByScriptHash(rpcUrl, layer2SudtScriptHash);
    return sudtId !== void 0 ? parseInt(sudtId, 16) : null;
  } catch (error) {
    return null;
  }
}
