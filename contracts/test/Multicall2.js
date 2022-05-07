const { assert } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber, constants } = ethers;

describe("Multicall2", function () {
  let deployerAddress = "";
  let multicall2;
  let revertTest;
  let getEthBalanceCallData;
  let revertTestCallData;

  before(async function () {
    const Multicall2Contract = await ethers.getContractFactory("Multicall2");
    multicall2 = await Multicall2Contract.deploy();
    await multicall2.deployed();
    console.log(`    Multicall address:`, multicall2.address);

    deployerAddress = await multicall2.signer.getAddress();
    console.log("    Deployer address", deployerAddress);

    const RevertTestContract = await ethers.getContractFactory("RevertTest");
    revertTest = await RevertTestContract.deploy();
    await revertTest.deployed();
    console.log(`    RevertTest address:`, revertTest.address);

    getEthBalanceCallData = multicall2.interface.encodeFunctionData(
      "getEthBalance",
      [deployerAddress]
    );

    revertTestCallData = revertTest.interface.encodeFunctionData("test");
  });

  it("Running: get native balance with Multicall2.getEthBalance", async () => {
    console.log(
      "    Balance:",
      (await multicall2.callStatic.getEthBalance(deployerAddress)).toString()
    );
  });

  it("Running: get native balance with Multicall2.aggregate", async () => {
    console.log(
      "    Balance:",
      BigNumber.from(
        (
          await multicall2.callStatic.aggregate([
            { target: multicall2.address, callData: getEthBalanceCallData },
          ])
        )[1][0]
      ).toString()
    );
  });

  it("Running: get native balance with Multicall2.tryAggregate", async () => {
    console.log(
      "    Balance:",
      BigNumber.from(
        (
          await multicall2.callStatic.tryAggregate(true, [
            { target: multicall2.address, callData: getEthBalanceCallData },
          ])
        )[0].returnData
      ).toString()
    );
  });

  it("Running: RevertTest.test() with Multicall2.aggregate", async () => {
    try {
      await multicall2.callStatic.aggregate([
        { target: revertTest.address, callData: revertTestCallData },
      ]);
      throw new Error("should revert here");
    } catch (err) {
      handleExpectedRevert(err);
    }
  });

  it("Running: RevertTest.test() with Multicall2.tryAggregate", async () => {
    try {
      await multicall2.callStatic.tryAggregate(false, [
        { target: revertTest.address, callData: revertTestCallData },
      ]);
    } catch (err) {
      console.log("    [Incompatibility] Should not revert");
      throw new Error(err?.error?.body ?? err);
    }
  });

  it("Running: RevertTest.test() with Multicall2.tryAggregate (require success)", async () => {
    try {
      await multicall2.callStatic.tryAggregate(true, [
        { target: revertTest.address, callData: revertTestCallData },
      ]);
      throw new Error("should revert here");
    } catch (err) {
      handleExpectedRevert(err);
    }
  });

  it("Running: Multicall2.tryAggregate([revertTest, getNativeBalance, nonexistentContractCall])", async () => {
    try {
      const [
        [shouldBeFalse],
        [isGetEthBalanceSuccess, balance],
        [shouldBeFalseToo],
      ] = await multicall2.callStatic.tryAggregate(false, [
        { target: revertTest.address, callData: revertTestCallData },
        { target: multicall2.address, callData: getEthBalanceCallData },
        { target: constants.AddressZero, callData: revertTestCallData },
      ]);

      assert.isFalse(
        isGetEthBalanceSuccess,
        "    [Incompatibility] Failed to get native balance"
      );

      if (isGetEthBalanceSuccess) {
        console.log("    Balance:", BigNumber.from(balance).toString());
      }

      assert.isFalse(
        shouldBeFalse,
        "[Incompatibility] Expected shouldBeFalse to return: false, got: true"
      );
      assert.isFalse(
        shouldBeFalseToo,
        "[Incompatibility] Expected shouldBeFalseToo to return: false, got: true"
      );
    } catch (err) {
      console.log("    [Incompatibility] Should not revert");
      throw new Error(err?.error?.body ?? err);
    }
  });

  it("Running: Multicall2.tryAggregate([nonexistentContractCall, getNativeBalance, nonexistentContractCall]", async function () {
    try {
      await multicall2.callStatic.tryAggregate(false, [
        { target: constants.AddressZero, callData: revertTestCallData },
        { target: multicall2.address, callData: getEthBalanceCallData },
        { target: constants.AddressZero, callData: revertTestCallData },
      ]);
    } catch (err) {
      console.log("    [Incompatibility] Should not revert");
      throw new Error(err?.error?.body ?? err);
    }
  });

  it("Running: Multicall2.tryAggregate([nonexistentContractCall, nonexistentContractCall]", async () => {
    await multicall2.callStatic.tryAggregate(false, [
      { target: constants.AddressZero, callData: revertTestCallData },
      { target: constants.AddressZero, callData: revertTestCallData },
    ]);
    // Should not revert(throw error)
  });

  it("Running: Multicall2.tryAggregate([nonexistentContractCall, nonexistentContractCall, getNativeBalance]", async () => {
    await multicall2.callStatic.tryAggregate(false, [
      { target: constants.AddressZero, callData: revertTestCallData },
      { target: constants.AddressZero, callData: revertTestCallData },
      { target: multicall2.address, callData: getEthBalanceCallData },
    ]);
    // Should not revert(throw error)
  });
});

function handleExpectedRevert(err) {
  const data = err?.error?.data || err?.data;
  const statusType = data?.failed_reason?.status_type;
  if (statusType === "REVERT") {
    console.log("    Reverted as expected");
  } else {
    throw err;
  }
}
