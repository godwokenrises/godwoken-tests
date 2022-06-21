const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const fetch = require("node-fetch");

const expectedValue = 10;
const expectedGas = "21000";

let ethCallContract;

const expectThrowsAsync = async (method, errMsgKeyWords) => {
  let error = null;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an("Error");
  if (errMsgKeyWords) {
    for(keyWord of errMsgKeyWords){
	console.log(error.message);
	expect(error.message).to.include(keyWord);
    }
  }
};

describe("Eth_estimateGas Cache Test", function () {
  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.deployed();
    await ethCallContract.set(expectedValue);
  });

  it("batch call", async () => {
    const count = 200;
    const p = new Array(count).fill(1).map(async () => {
      const value = await ethCallContract.estimateGas.get();
      return value;
    });
    const ps = Promise.all(p);
    const values = await ps;
    expect(values.length).to.equal(count);
    for (let i = 0; i < values.length; i++) {
      expect(values[i]).to.equal(expectedGas);
    }
  });

  it("batch call revert", async () => {
    const count = 200;
    const triggerValue = 444;

    const p = new Array(count).fill(1).map(async () => {
      const errMsgKeyWords = ["UNPREDICTABLE_GAS_LIMIT: ", "revert: Error(you trigger death value!)"]
      const method = async () => {
        await ethCallContract.estimateGas.getRevertMsg(triggerValue);
      };
      await expectThrowsAsync(method, errMsgKeyWords);
    });
    const ps = Promise.all(p);
    await ps;
  });

  it("estimateGas without from address", async () => {
    const transaction = await ethCallContract.populateTransaction.get();
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
    expect(BigInt(value.result).toString(10)).to.equal(
      expectedGas
    );
  });
});

/**
 * How to run this?
 * > npx hardhat test test/EthEstimateGas --network gw_devnet_v1
 */
