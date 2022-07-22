import { RPC } from 'ckb-js-toolkit';
import { Hash } from "@ckb-lumos/base";

export class GodwokenWeb3 {
  private rpc: RPC;
  private nodeInfo: any;

  constructor(url: string) {
    if (!url) throw new Error('RPC url cannot be empty');
    this.rpc = new RPC(url);
  }

  private async rpcCall(method_name: string, ...args: any[]): Promise<any> {
    return await this.rpc[`gw_${method_name}`](...args);
  }

  async getNodeInfo() {
    if (this.nodeInfo == null) {
      this.nodeInfo = await this.rpc['poly_version']();
    }

    return this.nodeInfo;
  }

  async getRollupTypeHash(): Promise<Hash> {
    const { nodeInfo } = await this.getNodeInfo();
    return nodeInfo.rollupCell.typeHash;
  }
}
