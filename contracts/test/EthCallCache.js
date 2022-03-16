const { expect } = require("chai");
const { ethers } = require("hardhat");

const expectedValue = 10;
let ethCallCacheContract;

const expectThrowsAsync = async (method, errorMessage) => {
  let error = null;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an("Error");
  if (errorMessage) {
    expect(error.message).to.include(errorMessage);
  }
};

describe("Eth_Call Cache Test", function () {
  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallCacheContract = await contractFact.deploy();
    await ethCallCacheContract.deployed();
    await ethCallCacheContract.set(expectedValue);
  });

  it("batch call", async () => {
    const count = 100;
    const p = new Array(count).fill(1).map(async () => {
      const value = await ethCallCacheContract.get();
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
    const count = 100;
    const triggerValue = 444;

    const p = new Array(count).fill(1).map(async () => {
      const errMsg = "revert: you trigger death value!";
      const method = async () => {
        await ethCallCacheContract.getRevertMsg(triggerValue);
      };
      await expectThrowsAsync(method, errMsg);
    });
    const ps = Promise.all(p);
    await ps;
  });
});

/**
 * How to run this?
 * > npx hardhat test test/EthCallCache --network gw_devnet_v1
 */
