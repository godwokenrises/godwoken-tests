import { predefined } from '@ckb-lumos/config-manager';

type ValueOf<T> = T[keyof T];
export enum Network {
  MainnetV1 = 'mainnet_v1',
  TestnetV1 = 'testnet_v1',
  AlphanetV1 = 'alphanet_v1',
}
export interface NetworkConfig {
  rpc: string;
  lumos: {
    config: ValueOf<typeof predefined>,
  };
}

export const networks : Record<Network, NetworkConfig> = {
  [Network.MainnetV1]: {
    rpc: 'https://v1.mainnet.godwoken.io/rpc',
    lumos: {
      config: predefined.LINA,
    }
  },
  [Network.TestnetV1]: {
    rpc: 'https://godwoken-testnet-v1.ckbapp.dev',
    lumos: {
      config: predefined.AGGRON4
    },
  },
  [Network.AlphanetV1]: {
    rpc: 'https://gw-alphanet-v1.godwoken.cf',
    lumos: {
      config: predefined.AGGRON4
    },
  },
};
