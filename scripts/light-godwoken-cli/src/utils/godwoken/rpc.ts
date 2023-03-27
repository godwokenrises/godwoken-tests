import { BigNumber } from 'ethers';
import { HexNumber, HexString } from '@ckb-lumos/base';
import { GodwokenV1 } from '../../libraries/light-godwoken';
import { retryIfFailed, waitFor } from '../async';

const rpcs: Record<string, GodwokenV1> = {};
export function getCachedRpc(uri: string) {
  if (!rpcs[uri]) rpcs[uri] = new GodwokenV1(uri);
  return rpcs[uri];
}
export async function retryRpcIfFailed<T>(getter: () => Promise<T>) {
  return retryIfFailed(async () => await getter(), 3, 1000);
}

export async function getBlockNumber(uri: string): Promise<number> {
  const rpc = getCachedRpc(uri);
  const hex = await retryRpcIfFailed(() => rpc.getBlockNumber());
  return BigNumber.from(hex).toNumber();
}

export async function waitTillBlockNumber(rpc: string, blockNumber?: number) {
  if (!blockNumber) {
    blockNumber = await getBlockNumber(rpc) + 1;
  }

  while (true) {
    await waitFor(1000);
    const latestBlockNumber = await getBlockNumber(rpc);
    if (latestBlockNumber >= blockNumber) {
      return latestBlockNumber;
    }
  }
}

export async function getScriptByScriptHash(uri: string, scriptHash: HexString) {
  const rpc = getCachedRpc(uri);
  return await retryRpcIfFailed(
    () => rpc.getScript(scriptHash)
  );
}

export async function getScriptHashByAccountId(uri: string, accountId: HexNumber) {
  const rpc = getCachedRpc(uri);
  return await retryRpcIfFailed(
    () => rpc.getScriptHash(accountId)
  );
}

export async function getAccountIdByScriptHash(uri: string, scriptHash: HexString) {
  const rpc = getCachedRpc(uri);
  return await retryRpcIfFailed(
    () => rpc.getAccountIdByScriptHash(scriptHash)
  );
}
