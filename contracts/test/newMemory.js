const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Memory Contract", function () {
  it("Deploy and new some memory", async () => {
    const contractFact = await ethers.getContractFactory("Memory");
    const contract = await contractFact.deploy();

    console.log("call:", contractFact.interface.encodeFunctionData("newMemory", [73728]));

    // console.log("estimateGas:", await contract.estimateGas());
    for (let step = 73728; step < 1024 * 1024 * 4; step += 1024) {
      let uint8Length = await contract.newMemory(step);
      console.log("uint8Length = ", parseInt(uint8Length));
      expect(uint8Length).to.equal(step);
    }
  });
});