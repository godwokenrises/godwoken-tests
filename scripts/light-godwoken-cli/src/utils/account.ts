import keccak256 from 'keccak256';
import { utils } from 'ethers';
import { HexString, Address } from '@ckb-lumos/base';
import { addHexPrefix } from './format';

export interface DerivedAccount {
  privateKey: HexString;
  ethAddress: Address;
}

// TODO: private-key has a max-limit, maybe we should generate derived accounts with hd-wallet
export function privateKeyToDerivedAccounts(privateKey: HexString, count: number): DerivedAccount[] {
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
