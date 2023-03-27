import keccak256 from 'keccak256';
import { HexString, Address } from '@ckb-lumos/base';
import { utils } from 'ethers';

export interface DerivedAccount {
  privateKey: HexString;
  ethAddress: Address;
}

// TODO: private-key has a max-limit, maybe we should generate derived accounts with hd-wallet
export function privateKeyToDerivedAccounts(privateKey: HexString, count: number): DerivedAccount[] {
  if (count > 64) {
    throw new Error('you can only generate up to 64 derived accounts from a private-key');
  }

  const keys: HexString[] = [privateKey];
  for (let i = 0; i < count; i++) {
    const newKey = '0x' + keccak256(keys[keys.length - 1]).toString('hex');
    keys.push(newKey);
  }

  return keys.slice(1).map((key) => ({
    privateKey: key,
    ethAddress: utils.computeAddress(key),
  }));
}
