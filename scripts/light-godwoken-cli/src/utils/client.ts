import { HexString } from '@ckb-lumos/base';
import {
  EthereumProvider, LightGodwokenConfig,
  LightGodwokenProvider, LightGodwokenV0, LightGodwokenV1,
  GodwokenVersion, GodwokenNetwork,
} from '../libraries/light-godwoken';
import { NetworkConfig } from '../config';
import { toNonHexString } from './format';

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
  const ethereum = EthereumProvider.fromPrivateKey(rpc, toNonHexString(params.privateKey));
  const ethAddress = await ethereum.getAddress();

  const lightGodwokenProvider = new LightGodwokenProvider({
    ethAddress,
    ethereum,
    network,
    version,
    config,
  });

  if (!(Object.keys(lightGodwokenVersionMap).includes(version))) {
    throw new Error('Unsupported version for LightGodwoken');
  }

  return new lightGodwokenVersionMap[version](lightGodwokenProvider);
}

export async function createLightGodwokenByNetworkConfig(privateKey: HexString, config: NetworkConfig) {
  return createLightGodwoken({
    privateKey: privateKey,
    rpc: config.rpc,
    network: config.network,
    version: config.version,
    config: config.lightGodwokenConfig,
  });
}
