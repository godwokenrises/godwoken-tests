import { GodwokenWeb3 } from './web3';
import { generateDepositLock } from './helpers/deposit';
import { utils, Hash, Script, HexString, Address } from '@ckb-lumos/base';
import { parseAddress, encodeToAddress } from '@ckb-lumos/helpers';
import { predefined, getConfig } from '@ckb-lumos/config-manager';
import { key } from '@ckb-lumos/hd';

import crypto from 'crypto';
import keccak256 from 'keccak256';

// https://github.com/nervosnetwork/godwoken/blob/d6c98d8f8a199b6ec29bc77c5065c1108220bb0a/crates/common/src/builtins.rs#L5
export const ETH_REGISTRY_ID: number = 2;

export const parseOptions = {
  config: predefined.AGGRON4
};

export async function privateKeyToLayer2DepositAddress(gw: GodwokenWeb3, privateKey: HexString) {
  const ckbAddress = privateKeyToCkbAddress(privateKey);
  const ethAddress = privateKeyToEthAddress(privateKey).toLocaleLowerCase();

  return addressPairToLayer2DepositAddress(gw, ckbAddress, ethAddress);
}

export async function addressPairToLayer2DepositAddress(gw: GodwokenWeb3, ckbAddress: HexString, ethAddress: HexString) {
  const { nodeInfo } = await gw.getNodeInfo();

  console.log(`from Address ${ckbAddress}`);
  console.log(`layer2LockArgs ${ethAddress}`);

  const gwRollupTypeHash: Hash = await gw.getRollupTypeHash();

  const ownerLock: Script = parseAddress(ckbAddress, parseOptions);
  const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);

  const layer2Lock: Script = {
    code_hash: nodeInfo.eoaScripts.eth.typeHash,
    hash_type: 'type',
    args: gwRollupTypeHash + ethAddress.slice(2),
  };

  const depositLock: Script = generateDepositLock(
    gwRollupTypeHash, ownerLockHash, layer2Lock,
    nodeInfo.gwScripts.deposit.typeHash
  );

  return encodeToAddress(depositLock, parseOptions);
}

export function privateKeyToCkbAddress(privateKey: HexString): Address {
  const publicKey = key.privateToPublic(privateKey);
  const publicKeyHash = key.publicKeyToBlake160(publicKey);
  const scriptConfig = parseOptions.config.SCRIPTS.SECP256K1_BLAKE160!;
  const script = {
    code_hash: scriptConfig.CODE_HASH,
    hash_type: scriptConfig.HASH_TYPE,
    args: publicKeyHash,
  };

  return encodeToAddress(script, parseOptions);
}

export function privateKeyToEthAddress(privateKey: HexString) {
  const ecdh = crypto.createECDH(`secp256k1`);
  ecdh.generateKeys();
  ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), 'hex'));
  const publicKey: string = '0x' + ecdh.getPublicKey('hex', 'uncompressed');
  const address = keccak256(Buffer.from(publicKey.slice(4), 'hex')).slice(12).toString('hex');
  return `0x${address}`;
}