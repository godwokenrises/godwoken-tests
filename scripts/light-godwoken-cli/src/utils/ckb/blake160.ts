import { key } from '@ckb-lumos/hd';
import { Config } from '@ckb-lumos/config-manager';
import { Address, HexString, Script } from '@ckb-lumos/base';
import { encodeToAddress } from '@ckb-lumos/helpers';

export function privateKeyToBlake160LockScript(privateKey: HexString, config: Config): Script {
  privateKey = !privateKey.startsWith('0x') ? `0x${privateKey}` : privateKey;
  const publicKey = key.privateToPublic(privateKey);
  const publicKeyHash = key.publicKeyToBlake160(publicKey);
  const scriptConfig = config.SCRIPTS.SECP256K1_BLAKE160!;
  return {
    code_hash: scriptConfig.CODE_HASH,
    hash_type: scriptConfig.HASH_TYPE,
    args: publicKeyHash,
  };
}

export function privateKeyToBlake160Address(privateKey: HexString, config: Config): Address {
  const lockScript = privateKeyToBlake160LockScript(privateKey, config);
  return encodeToAddress(lockScript, { config });
}
