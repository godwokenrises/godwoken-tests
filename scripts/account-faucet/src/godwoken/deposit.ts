import { Hash, HexNumber, HexString, Script } from '@ckb-lumos/base';
import { Reader } from '@ckb-lumos/toolkit';
import { ETH_REGISTRY_ID } from '../faucet/address';
import * as normalizers from './normalizers';
import * as molecule from './molecule';

export interface DepositLockArgs {
  owner_lock_hash: Hash;
  layer2_lock: Script;
  // uint64
  cancel_timeout: HexNumber;
  // uint32
  registry_id: HexNumber;
}

export class DepositLockArgsCodec {
  readonly depositLockArgs__: DepositLockArgs;
  constructor(depositLockArgs: DepositLockArgs) {
    this.depositLockArgs__ = depositLockArgs;
  }

  HexSerialize(): HexString {
    const normalized = normalizers.normalizeObject(
      "DepositLockArgs",
      this.depositLockArgs__,
      {
        owner_lock_hash: normalizers.normalizeRawData(32),
        layer2_lock: normalizers.toNormalize(normalizers.normalizeScript),
        cancel_timeout: normalizers.normalizeHexNumber(8),
        registry_id: normalizers.normalizeHexNumber(4),
      }
    );
    return Reader.from(
      molecule.SerializeDepositLockArgs(normalized)
    ).serializeJson();
  }
}

export function generateDepositLock(
  gwRollupTypeHash: Hash,
  ownerLockHash: Hash,
  layer2Lock: Script,
  depositLockTypeHash: Hash
): Script {
  const depositLockArgs: DepositLockArgs = {
    owner_lock_hash: ownerLockHash,
    layer2_lock: layer2Lock,
    cancel_timeout: "0xc000000000093a81",
    registry_id: '0x' + ETH_REGISTRY_ID,
  };

  const depositLockArgsCodec = new DepositLockArgsCodec(depositLockArgs);
  const depositLockArgsHexString = gwRollupTypeHash + depositLockArgsCodec.HexSerialize().slice(2);

  return {
    code_hash: depositLockTypeHash,
    hash_type: "type",
    args: depositLockArgsHexString,
  };
}