import { GodwokenNetwork, GodwokenVersion, LightGodwokenConfig, predefinedConfigs } from './libraries/light-godwoken';
import { AlphanetConfigV1 } from './configs/alphanet';
import { DevnetConfigV1 } from './configs/devnet';

export enum Network {
  MainnetV1 = 'mainnet_v1',
  TestnetV1 = 'testnet_v1',
  AlphanetV1 = 'alphanet_v1',
  DevnetV1 = 'devnet_v1',
}

export interface NetworkConfig {
  rpc: string;
  network: string;
  version: GodwokenVersion;
  lightGodwokenConfig?: LightGodwokenConfig;
}

export const networks : Record<Network, NetworkConfig> = {
  [Network.MainnetV1]: {
    rpc: 'https://v1.mainnet.godwoken.io/rpc',
    network: GodwokenNetwork.Mainnet,
    version: GodwokenVersion.V1,
    lightGodwokenConfig: predefinedConfigs.mainnet.v1,
  },
  [Network.TestnetV1]: {
    rpc: 'https://godwoken-testnet-v1.ckbapp.dev',
    network: GodwokenNetwork.Testnet,
    version: GodwokenVersion.V1,
    lightGodwokenConfig: predefinedConfigs.testnet.v1,
  },
  [Network.AlphanetV1]: {
    rpc: 'https://godwoken-alphanet-v1.ckbapp.dev',
    network: 'alphanet',
    version: GodwokenVersion.V1,
    lightGodwokenConfig: AlphanetConfigV1,
  },
  [Network.DevnetV1]: {
    rpc: 'http://127.0.0.1:8024',
    network: 'devnet',
    version: GodwokenVersion.V1,
    lightGodwokenConfig: DevnetConfigV1,
  },
};
