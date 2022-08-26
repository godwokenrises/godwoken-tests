import { HexString } from '@ckb-lumos/base';
import {
  EthereumProvider, LightGodwokenConfig,
  LightGodwokenProvider, LightGodwokenV0, LightGodwokenV1,
  GodwokenVersion, GodwokenNetwork,
} from '../libraries/light-godwoken';

export const lightGodwokenVersionMap = {
  'v0': LightGodwokenV0,
  'v1': LightGodwokenV1,
};

export async function createLightGodwoken(params: {
  rpc: string,
  privateKey: HexString,
  network: GodwokenNetwork | string,
  version: GodwokenVersion,
  config?: LightGodwokenConfig,
}) {
  const { rpc, network, version, config } = params;
  let { privateKey } = params;

  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.slice(2);
  }

  const ethereum = EthereumProvider.fromPrivateKey(rpc, privateKey);
  const account = await ethereum.getAddress();

  const configMap = config ? {
    v0: config,
    v1: config,
  } : void 0;

  const lightGodwokenProvider = new LightGodwokenProvider(account, ethereum, network, version, configMap);
  if (!(Object.keys(lightGodwokenVersionMap).includes(version))) {
    throw new Error('Unsupported version for LightGodwoken');
  }

  return new lightGodwokenVersionMap[version](lightGodwokenProvider);
}
