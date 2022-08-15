import { Address } from '@ckb-lumos/base';
import {
  EthereumProvider, LightGodwokenProvider,
  LightGodwokenV0, LightGodwokenV1,
  GodwokenVersion,
} from 'light-godwoken';

export const lightGodwokenVersionMap = {
  'v0': LightGodwokenV0,
  'v1': LightGodwokenV1,
};

export async function createLightGodwoken(version: GodwokenVersion, rpc: string, privateKey: Address) {
  const ethereumProvider = EthereumProvider.fromPrivateKey(rpc, privateKey);
  const account = await ethereumProvider.getAddress();

  const lightGodwokenProvider = new LightGodwokenProvider(account, ethereumProvider, version);
  if (!(Object.keys(lightGodwokenVersionMap).includes(version))) {
    throw new Error('Unsupported version for LightGodwoken');
  }

  return new lightGodwokenVersionMap[version](lightGodwokenProvider);
}
