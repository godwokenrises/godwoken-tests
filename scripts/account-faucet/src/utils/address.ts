import { utils, Hash, Script, HexString, Address } from '@ckb-lumos/base';
import { parseAddress, encodeToAddress } from '@ckb-lumos/helpers';
import { utils as ethersUtils } from 'ethers';
import { key } from '@ckb-lumos/hd';
import { NetworkConfig } from '../config';
import { GodwokenWeb3 } from '../godwoken/web3';
import { generateDepositLock } from '../godwoken/deposit';

// https://github.com/nervosnetwork/godwoken/blob/d6c98d8f8a199b6ec29bc77c5065c1108220bb0a/crates/common/src/builtins.rs#L5
export const ETH_REGISTRY_ID: number = 2;

// Default faucet refund address
// This is also the address that sends the faucet transaction
export const DEFAULT_CKB_DEPOSIT_ADDRESS = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x';

export async function encodeLayer2DepositAddress(config: NetworkConfig, gw: GodwokenWeb3, ckbAddress: Address, ethAddress: HexString): Promise<Address> {
  const { nodeInfo } = await gw.getNodeInfo();
  const gwRollupTypeHash: Hash = await gw.getRollupTypeHash();

  const ownerLock: Script = parseAddress(ckbAddress, config.lumos);
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

  return encodeToAddress(depositLock, config.lumos);
}

export async function privateKeyToLayer2DepositAddress(config: NetworkConfig, gw: GodwokenWeb3, privateKey: HexString): Promise<Address> {
  const ckbAddress = privateKeyToCkbAddress(privateKey, config);
  const ethAddress = privateKeyToEthAddress(privateKey);

  return encodeLayer2DepositAddress(config, gw, ckbAddress, ethAddress.toLocaleLowerCase());
}

export function privateKeyToCkbAddress(privateKey: HexString, config: NetworkConfig): Address {
  privateKey = addHexPrefix(privateKey);
  const publicKey = key.privateToPublic(privateKey);
  const publicKeyHash = key.publicKeyToBlake160(publicKey);
  const scriptConfig = config.lumos.config.SCRIPTS.SECP256K1_BLAKE160!;
  const lockScript = {
    code_hash: scriptConfig.CODE_HASH,
    hash_type: scriptConfig.HASH_TYPE,
    args: publicKeyHash,
  };

  return encodeToAddress(lockScript, config.lumos);
}

export function privateKeyToOmniCkbAddress(privateKey: HexString, config: NetworkConfig): Address {
  const l2Address = privateKeyToEthAddress(privateKey);
  const omniLock: Script = {
    code_hash: '0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e', // TODO: replace the hard-code
    hash_type: 'type',
    // omni flag       pubkey hash   omni lock flags
    // chain identity   eth addr      function flag()
    // 00: Nervos       👇            00: owner
    // 01: Ethereum     👇            01: administrator
    //      👇          👇            👇
    args: `0x01${l2Address.substring(2)}00`,
  };

  return encodeToAddress(omniLock, config.lumos);
}

export function privateKeyToEthAddress(privateKey: HexString): HexString {
  privateKey = addHexPrefix(privateKey);
  return ethersUtils.computeAddress(privateKey);
}

export function addHexPrefix(target: string): HexString {
  return target.startsWith('0x') ? target : `0x${target}`;
}

export function removeHexPrefix(target: string): string {
  return target.startsWith('0x') ? target.slice(2) : target;
}
