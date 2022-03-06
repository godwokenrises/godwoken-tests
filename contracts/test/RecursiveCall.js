const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Recursion Contract", function () {
  it("Deploy and call recursive functions", async () => {
    const contractFact = await ethers.getContractFactory("RecursionContract");
    const recurContract = await contractFact.deploy();
    await recurContract.deployed();

    const maxDepth = 36
    for (let i = 1; i <= maxDepth; i++) {
      let pureSumLoop = await recurContract.pureSumLoop(i);
      // console.log("call:", contractFact.interface.encodeFunctionData("sum", [64]));
      let sum = await recurContract.sum(i);

      console.log("depth:", i);
      console.log("\t sum = ", parseInt(sum));
      expect(sum).to.equal(pureSumLoop);
    }

    // depth 1024
    // Error: Transaction reverted: contract call run out of gas and made the transaction revert

  });
});

/**
 * How to run this?
 * > npx hardhat test test/RecursiveCall --network gw_devnet_v1
 */
