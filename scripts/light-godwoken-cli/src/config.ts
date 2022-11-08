import { GodwokenVersion, LightGodwokenConfig } from 'light-godwoken';
import { alphanetConfigV1 } from './configs/alphanet';
import { devnetConfigV1 } from './configs/devnet';

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
    network: 'mainnet',
    version: 'v1',
  },
  [Network.TestnetV1]: {
    rpc: 'https://godwoken-testnet-v1.ckbapp.dev',
    network: 'testnet',
    version: 'v1',
  },
  [Network.AlphanetV1]: {
    rpc: 'https://gw-alphanet-v1.godwoken.cf',
    network: 'alphanet',
    version: 'v1',
    lightGodwokenConfig: alphanetConfigV1,
  },
  [Network.DevnetV1]: {
    rpc: 'http://127.0.0.1:8024',
    network: 'devnet',
    version: 'v1',
    lightGodwokenConfig: devnetConfigV1,
  },
};
