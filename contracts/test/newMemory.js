const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("Memory Contract", function () {
  if (isGwMainnetV1()) {
    return;
  }

  it("Deploy and new some memory", async () => {
    const contractFact = await ethers.getContractFactory("Memory");
    const contract = await contractFact.deploy();
    await contract.deployed();

    const maxMemory = 3_932_160 / 256; // 1024 * 1024 * 3 = 3,932,160 = 3 MB
    for (let step = 1024; step <= maxMemory; step += 1024) {
      let uint8Length = await contract.newMemory(step);
      expect(uint8Length).to.equal(step);
    }
  });
});

/**
 * How to run this?
 * > npx hardhat test test/newMemory --network gw_devnet_v1
 */
