import { Script } from '@ckb-lumos/base';
import { LightGodwokenConfig } from '../libraries/light-godwoken';

export function createSudtTypeScript(sudtL1LockArgs: string, config: LightGodwokenConfig): Script {
  const sudtScriptConfig = config.layer1Config.SCRIPTS.sudt;
  return {
    code_hash: sudtScriptConfig.code_hash,
    hash_type: sudtScriptConfig.hash_type,
    args: sudtL1LockArgs,
  };
}
