const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const fetch = require("node-fetch");
const { isGwMainnetV1 } = require('../utils/network');
const { expectThrowsAsync } = require('../utils/throw');

const expectedValue = 10;
let ethCallContract;

describe("Eth_Call Cache Test", function () {
  if (isGwMainnetV1()) {
    return;
  }

  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.deployed();
    const tx = await ethCallContract.set(expectedValue);
    await tx.wait();
  });

  it("batch call", async () => {
    const count = 200;
    const p = new Array(count).fill(1).map(async () => {
      const value = await ethCallContract.get();
      return value;
    });
    const ps = Promise.all(p);
    const values = await ps;
    expect(values.length).to.equal(count);
    for (let i = 0; i < values.length; i++) {
      expect(values[i]).to.equal(expectedValue);
    }
  });

  it("batch call revert", async () => {
    const count = 200;
    const triggerValue = 444;

    const p = new Array(count).fill(1).map(async () => {
      const errMsg = "you trigger death value!";
      const method = async () => {
        await ethCallContract.getRevertMsg(triggerValue);
      };
      await expectThrowsAsync(method, errMsg);
    });
    const ps = Promise.all(p);
    await ps;
  });

  it("call without from address", async () => {
    const transaction = await ethCallContract.populateTransaction.get();
    // ethers.provider will auto fill from address, so we use fetch to call rpc
    const body =
      '{"jsonrpc": "2.0", "method":"eth_call", "params": [{"to":"' +
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
    expect(BigInt(value.result).toString(10)).to.equal(
      expectedValue.toString()
    );
  });
});

/**
 * How to run this?
 * > npx hardhat test test/EthCall --network gw_devnet_v1
 */
