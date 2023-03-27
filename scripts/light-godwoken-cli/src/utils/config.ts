import { networks, Network } from '../config';

export function getConfig(network: Network) {
  if (!networks[network]) throw new Error(`Network not exist: ${network}`);
  return networks[network];
}
