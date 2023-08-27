const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const toolkit = require("@ckb-lumos/toolkit");
const schemas = require("../../schemas");
const normalizers = require("../lib/normalizer");
const { getAccountIdByContractAddress } = require("../lib/helper");
const { isGwMainnetV1, isAxon } = require("../utils/network");
const { expectThrowsAsync } = require("../utils/throw");

const expectedValue = 10;

let ethCallContract;
let ethCallContractAddress;

const rpc = new toolkit.RPC(network.config.url);

const executeGwRawTx = async (chainId, toId, polyArgs) => {
  const rawL2Tx = {
    chain_id: chainId,
    from_id: "0x3",
    to_id: toId,
    nonce: "0x0",
    args: polyArgs,
  };

  const serializeRawL2Tx = new toolkit.Reader(
    schemas.SerializeRawL2Transaction(
      normalizers.NormalizeRawL2Transaction(rawL2Tx)
    )
  ).serializeJson();

  const value = await rpc.gw_execute_raw_l2transaction(serializeRawL2Tx);
  return value;
};

describe("gw_execute_raw_l2transaction Cache Test", function () {
  if (isAxon()) {
      return
  }
  if (isGwMainnetV1()) {
    return;
  }

  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.waitForDeployment();
    ethCallContractAddress=await ethCallContract.getAddress();
    const tx = await ethCallContract.set(expectedValue);
    await tx.wait();
  });

  it("batch call", async () => {
    const count = 100;
    const toId = await getAccountIdByContractAddress(
      rpc,
      ethCallContractAddress
    );
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const args =
      "0xffffff504f4c590020bcbe00000000000000000000000000000000000000000000000000000000000000000000000000040000006d4ce63c";

    const p = new Array(count).fill(1).map(async () => {
      const value = await executeGwRawTx(chainId, toId, args);
      return value;
    });
    const ps = Promise.all(p);
    const values = await ps;

    expect(values.length).to.equal(count);
    for (let i = 0; i < values.length; i++) {
      expect(+values[i].return_data).to.equal(expectedValue);
    }
  });

  it("batch call revert", async () => {
    const count = 100;
    const toId = await getAccountIdByContractAddress(
      rpc,
      ethCallContractAddress
    );
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const args =
      "0xffffff504f4c590020bcbe0000000000000000000000000000000000000000000000000000000000000000000000000024000000df57407800000000000000000000000000000000000000000000000000000000000001bc";

    const p = new Array(count).fill(1).map(async () => {
      const errMsgKeyWords = ["you trigger death value!"];
      const method = async () => {
        await executeGwRawTx(chainId, toId, args);
      };
      await expectThrowsAsync(method, errMsgKeyWords);
    });
    const ps = Promise.all(p);
    await ps;
  });
});

/**
 * How to run this?
 * > npx hardhat test test/GwExecuteRawL2Tx --network gw_devnet_v1
 */
