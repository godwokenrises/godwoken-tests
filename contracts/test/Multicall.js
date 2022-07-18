const { assert } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');
const { BigNumber, constants } = ethers;

describe("Multicall", () => {
  if (isGwMainnetV1()) {
    return;
  }

  let deployerAddress = "";
  let multicall;
  let callData;

  before(async () => {
    const MulticallContract = await ethers.getContractFactory("Multicall");
    multicall = await MulticallContract.deploy();
    await multicall.deployed();
    console.log(`    Multicall address:`, multicall.address);

    deployerAddress = await multicall.signer.getAddress();
    console.log(`    Deployer address:`, deployerAddress);

    callData = multicall.interface.encodeFunctionData("getEthBalance", [
      deployerAddress,
    ]);
  });

  it("Running: get native balance with Multicall.getEthBalance", async () => {
    console.log(
      "    Balance:",
      (await multicall.callStatic.getEthBalance(deployerAddress)).toString()
    );
  });

  it("Running: get native balance with Multicall.aggregate", async () => {
    console.log(
      "    Balance:",
      BigNumber.from(
        (
          await multicall.callStatic.aggregate([
            { target: multicall.address, callData: callData },
          ])
        )[1][0]
      ).toString()
    );
  });

  it("Running: calling nonexistent contract with Multicall.aggregate", async function () {
    try {
      const result = (
        await multicall.callStatic.aggregate([
          { target: constants.AddressZero, callData: callData },
        ])
      )[1][0];
      assert.equal(result, "0x");
    } catch (err) {
      console.log("    [Incompatibility] Should not revert");
      throw new Error(err?.error?.body ?? err);
    }
  });
});
