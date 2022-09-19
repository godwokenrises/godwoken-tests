import { RPC } from 'ckb-js-toolkit';
import { BigNumber } from 'ethers';
import { retryIfFailed, waitFor } from '../async';
import { HexString } from '@ckb-lumos/base';

const rpcs: Record<string, RPC> = {};

export function getCachedRpc(uri: string) {
  if (!rpcs[uri]) rpcs[uri] = new RPC(uri);
  return rpcs[uri];
}

export async function getBlockNumber(rpc: string): Promise<number> {
  const hex: string = await getCachedRpc(rpc)['eth_blockNumber']();
  return BigNumber.from(hex).toNumber();
}

export async function tryGetBlockNumber(rpc: string) {
  return retryIfFailed(
    async () => await getBlockNumber(rpc),
    10,
    200
  );
}

export async function waitTillBlockNumber(rpc: string, blockNumber?: number) {
  if (!blockNumber) {
    blockNumber = await tryGetBlockNumber(rpc) + 1;
  }

  while (true) {
    await waitFor(200);
    const latestBlockNumber = await tryGetBlockNumber(rpc);
    if (latestBlockNumber >= blockNumber) {
      return latestBlockNumber;
    }
  }
}

export async function getAccountIdByScriptHash(rpc: string, scriptHash: HexString) {
  return getCachedRpc(rpc)['gw_get_account_id_by_script_hash'](scriptHash);
}
