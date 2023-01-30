import { predefined } from '@ckb-lumos/config-manager';

type ValueOf<T> = T[keyof T];
export enum Network {
  TestnetV1 = 'testnet_v1',
  AlphanetV1 = 'alphanet_v1',
  MainnetV1 = 'mainnet_v1',
}

export const testnetNetworks = [Network.TestnetV1, Network.AlphanetV1];
export const allNetworks = Object.values(Network);

export interface NetworkConfig {
  rpc: string;
  lumos: {
    config: ValueOf<typeof predefined>,
  };
  scripts: {
    OMNI_LOCK: {
      codeHash: string,
    },
  };
}

export const networks : Record<Network, NetworkConfig> = {
  [Network.TestnetV1]: {
    rpc: 'https://v1.testnet.godwoken.io/rpc',
    lumos: {
      config: predefined.AGGRON4
    },
    scripts: {
      OMNI_LOCK: {
        codeHash: '0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e',
      },
    },
  },
  [Network.AlphanetV1]: {
    rpc: 'https://gw-alphanet-v1.godwoken.cf',
    lumos: {
      config: predefined.AGGRON4
    },
    scripts: {
      OMNI_LOCK: {
        codeHash: '0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e',
      },
    },
  },
  [Network.MainnetV1]: {
    rpc: 'https://v1.mainnet.godwoken.io/rpc',
    lumos: {
      config: predefined.LINA
    },
    scripts: {
      OMNI_LOCK: {
        codeHash: '0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f',
      },
    },
  },
};
