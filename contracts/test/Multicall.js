const { assert } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("Multicall", () => {
  if (isGwMainnetV1()) {
    return;
  }

  let deployerAddress = "";
  let multicall;
  let callData;
  let address;

  before(async () => {
    const MulticallContract = await ethers.getContractFactory("Multicall");
    multicall = await MulticallContract.deploy();
    await multicall.waitForDeployment();
    address = await multicall.getAddress();
    const deployTx = multicall.deploymentTransaction()
    deployerAddress = deployTx.from;
    console.log(`    Multicall address:`, address);
    console.log(`    Deployer address:`, deployerAddress);

    callData = multicall.interface.encodeFunctionData("getEthBalance", [
      deployerAddress,
    ]);
  });

  it("Running: get native balance with Multicall.getEthBalance", async () => {
    console.log(
      "    Balance:",
      (await multicall.getFunction("getEthBalance").staticCall(deployerAddress)).toString()
    );
  });

  it("Running: get native balance with Multicall.aggregate", async () => {
    console.log(
      "    Balance:",
      BigInt(
        (
          await multicall.getFunction("aggregate").staticCall([
            { target: address, callData: callData },
          ])
        )[1][0]
      ).toString()
    );
  });

  it("Running: calling nonexistent contract with Multicall.aggregate", async function () {
    try {
      const result = (
        await multicall.getFunction("aggregate").staticCall([
          { target: ethers.ZeroAddress, callData: callData },
        ])
      )[1][0];
      assert.equal(result, "0x");
    } catch (err) {
      console.log("    [Incompatibility] Should not revert");
      throw new Error(err?.error?.body ?? err);
    }
  });
});
