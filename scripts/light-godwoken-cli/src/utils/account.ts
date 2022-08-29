import keccak256 from 'keccak256';
import { utils } from 'ethers';
import { HexString, Address } from '@ckb-lumos/base';
import { addHexPrefix } from './format';

export interface DerivedAccount {
  privateKey: HexString;
  ethAddress: Address;
}
export function privateKeyToDerivedAccounts(privateKey: HexString, count: number): DerivedAccount[] {
  if (count > 64) {
    throw new Error('you can only generate up to 64 derived accounts from a private-key');
  }

  const keys = [addHexPrefix(privateKey)];
  for (let i = 0; i < count; i++) {
    const newKey = '0x' + keccak256(keys[keys.length - 1]).toString('hex');
    keys.push(newKey);
  }

  return keys.slice(1).map((key) => ({
    privateKey: key,
    ethAddress: utils.computeAddress(key),
  }));
}
