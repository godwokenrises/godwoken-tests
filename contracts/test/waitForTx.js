const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wait For Tx", function () {
  let contract;

  beforeEach(async function () {
    const contractFact = await ethers.getContractFactory(
      "contracts/SimpleStorage.sol:SimpleStorage"
    );
    contract = await contractFact.deploy();
    await contract.deployed();
  });

  it("Deploy and call set state", async () => {
    const setValue = 233;
    const tx = await contract.set(setValue);
    await tx.wait(1);
    const getValue = await contract.get();
    expect(getValue).to.be.equal(setValue);
  });
});

/**
 * How to run this?
 * > npx hardhat test test/waitForTx.js --network gw_devnet_v1
 */
