const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("Recursion Contract", function () {
  if (isGwMainnetV1()) {
    return;
  }

  this.timeout(100 * 1000);
  it("Deploy and call recursive functions", async () => {
    const contractFact = await ethers.getContractFactory("RecursionContract");
    const recurContract = await contractFact.deploy();
    await recurContract.waitForDeployment();

    const maxDepth = 35;
    for (let i = 1; i <= maxDepth; i++) {
      let pureSumLoop = await recurContract.getFunction("pureSumLoop").staticCall(i);
      let sum = await recurContract.getFunction("sum").staticCall(i);

      console.log("depth:", i, "\t sum = ", parseInt(sum));
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
