const fetch = require("node-fetch");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');
const { expectThrowsAsync } = require('../utils/throw');

const expectedValue = 10;
const expectedGas = 21000n;

let ethCallContract;

describe("Eth_estimateGas Cache Test", function () {
  if (isGwMainnetV1()) {
    return;
  }

  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.waitForDeployment();
    const tx = await ethCallContract.getFunction("set").send(expectedValue);
    await tx.wait();
  });

  it("batch call", async () => {
    const count = 20;
    const p = new Array(count).fill(1).map(async () => {
      return await ethCallContract.getFunction("get").estimateGas();
    });
    const ps = Promise.all(p);
    const values = await ps;
    expect(values.length).to.equal(count);
    for (let i = 0; i < values.length; i++) {
      expect(values[i] >= expectedGas).to.be.true;
    }
  });

  it("batch call revert", async () => {
    const count = 20;
    const triggerValue = 444;

    const p = new Array(count).fill(1).map(async () => {
      const errMsgKeyWords = [
        "you trigger death value!",
      ];
      const method = async () => {
        await ethCallContract.getFunction("getRevertMsg").estimateGas(triggerValue);
      };
      await expectThrowsAsync(method, errMsgKeyWords);
    });
    const ps = Promise.all(p);
    await ps;
  });

  it("estimateGas without from address", async () => {
    const transaction = await ethCallContract.getFunction("get").populateTransaction();
    // ethers.provider will auto fill from address, so we use fetch to call rpc
    const body =
      '{"jsonrpc": "2.0", "method":"eth_estimateGas", "params": [{"to":"' +
      transaction.to +
      '", "data": "' +
      transaction.data +
      '"}, "latest"], "id": 1}';
    const response = await fetch(network.config.url, {
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const value = await response.json();
    expect(BigInt(value.result) >= expectedGas).to.be.true;
  });
});

/**
 * How to run this?
 * > npx hardhat test test/EthEstimateGas --network gw_devnet_v1
 */
