import config from '../config';
import { GodwokenWeb3 } from '../godwoken/web3';
import { generateDepositLock } from '../godwoken/deposit';
import { utils, Hash, Script, HexString, Address } from '@ckb-lumos/base';
import { parseAddress, encodeToAddress } from '@ckb-lumos/helpers';
import { key } from '@ckb-lumos/hd';
import keccak256 from 'keccak256';
import crypto from 'crypto';

// https://github.com/nervosnetwork/godwoken/blob/d6c98d8f8a199b6ec29bc77c5065c1108220bb0a/crates/common/src/builtins.rs#L5
export const ETH_REGISTRY_ID: number = 2;

// https://github.com/nervosnetwork/lumos/blob/develop/packages/config-manager/src/predefined.ts#L71-L123
export const lumosOptions = {
  config: config.lumosConfig,
};

export async function encodeLayer2DepositAddress(gw: GodwokenWeb3, ckbAddress: Address, ethAddress: HexString): Promise<Address> {
  const { nodeInfo } = await gw.getNodeInfo();
  const gwRollupTypeHash: Hash = await gw.getRollupTypeHash();

  const ownerLock: Script = parseAddress(ckbAddress, lumosOptions);
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

  return encodeToAddress(depositLock, lumosOptions);
}

export async function privateKeyToLayer2DepositAddress(gw: GodwokenWeb3, privateKey: HexString): Promise<Address> {
  const ckbAddress = privateKeyToCkbAddress(privateKey);
  const ethAddress = privateKeyToEthAddress(privateKey);

  return encodeLayer2DepositAddress(gw, ckbAddress, ethAddress.toLocaleLowerCase());
}

export function privateKeyToCkbAddress(privateKey: HexString): Address {
  const publicKey = key.privateToPublic(privateKey);
  const publicKeyHash = key.publicKeyToBlake160(publicKey);
  const scriptConfig = lumosOptions.config.SCRIPTS.SECP256K1_BLAKE160!;
  const script = {
    code_hash: scriptConfig.CODE_HASH,
    hash_type: scriptConfig.HASH_TYPE,
    args: publicKeyHash,
  };

  return encodeToAddress(script, lumosOptions);
}

export function privateKeyToEthAddress(privateKey: HexString): HexString {
  const ecdh = crypto.createECDH(`secp256k1`);
  ecdh.generateKeys();
  ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), 'hex'));
  const publicKey: string = '0x' + ecdh.getPublicKey('hex', 'uncompressed');
  const address = keccak256(Buffer.from(publicKey.slice(4), 'hex')).slice(12).toString('hex');
  return `0x${address}`;
}

export function toHexString(target: string): HexString {
  return target.startsWith('0x') ? target : `0x${target}`;
}

export function toAddress(target: string): Address {
  return target.startsWith('0x') ? target.slice(2) : target;
}