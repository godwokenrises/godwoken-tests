const { assert } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("ContractAddress", function () {
  if (isGwMainnetV1()) {
    return;
  }

  it("Contract address should be null when not deploy contract", async function () {
    const Storage = await ethers.getContractFactory("Calc");
    const contract = await Storage.deploy();
    await contract.waitForDeployment();

    // Set data
    const tx = await contract.getFunction("store").send(256);
    await tx.wait();
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    assert.isNull(receipt.contractAddress);
    console.log(receipt);
  });
});
