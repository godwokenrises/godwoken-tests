const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Memory Contract", function () {
  it("Deploy and new some memory", async () => {
    const contractFact = await ethers.getContractFactory("Memory");
    const contract = await contractFact.deploy();
    // console.log("call:", contractFact.interface.encodeFunctionData("newMemory", [73728]));

    const maxMemory = 3_932_160 / 256; // 1024 * 1024 * 3 = 3,932,160 = 3 MB
    for (let step = 1024; step <= maxMemory; step += 1024) {
      let uint8Length = await contract.newMemory(step);
      // console.log("uint8Length = ", parseInt(uint8Length));
      expect(uint8Length).to.equal(step);
    }
  });
});

/**
 * How to run this?
 * > npx hardhat test test/newMemory --network gw_devnet_v1
 */
