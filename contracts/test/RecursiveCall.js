const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Recursion Contract", function () {
  it("Deploy and call recursive functions", async () => {
    const [owner] = await ethers.getSigners();
    const contractFact = await ethers.getContractFactory("RecursionContract");

    console.log("call:", contractFact.interface.encodeFunctionData("sum", [64]));
    const recurContract = await contractFact.deploy();


    for (let i = 64; i <= 1025; i++) {
      let pureSumLoop = await recurContract.pureSumLoop(i);
      let sum = await recurContract.sum(i);

      console.log("depth:", i);
      console.log("\t sum = ", parseInt(sum));
      expect(sum).to.equal(pureSumLoop);
    }

    // depth 1024
    // Error: Transaction reverted: contract call run out of gas and made the transaction revert
  
  });
});
