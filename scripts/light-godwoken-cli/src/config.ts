import { GodwokenVersion } from 'light-godwoken';

export enum Network {
  DevnetV1 = 'devnet_v1',
  MainnetV1 = 'mainnet_v1',
  TestnetV1 = 'testnet_v1',
  AlphanetV1 = 'alphanet_v1',
}

export interface NetworkConfig {
  rpc: string;
  version: GodwokenVersion;
}

export const networks : Record<Network, NetworkConfig> = {
  [Network.DevnetV1]: {
    rpc: 'http://localhost:8024',
    version: 'v1',
  },
  [Network.MainnetV1]: {
    rpc: 'https://v1.mainnet.godwoken.io/rpc',
    version: 'v1',
  },
  [Network.TestnetV1]: {
    rpc: 'https://godwoken-testnet-v1.ckbapp.dev',
    version: 'v1',
  },
  [Network.AlphanetV1]: {
    rpc: 'https://godwoken-alphanet-v1.ckbapp.dev',
    version: 'v1',
  },
};
