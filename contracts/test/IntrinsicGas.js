const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1, isAxon } = require('../utils/network');
const { expectThrowsAsync } = require('../utils/throw');

const expectedValue = 10;
let ethCallContract;

describe("MIN GAS PRICE Test", function () {
  // The test is good, but the error message is different.
  if (isAxon()) {
    return;
  }
  if (isGwMainnetV1()) {
    return;
  }


  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.waitForDeployment();
  });

  it("Eth_sendRawTransaction with no special gasLimit setting", async () => {
    const tx = await ethCallContract.getFunction("set").send(expectedValue);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });

  it("Eth_sendRawTransaction with 0 gasLimit", async () => {
    const errMsg = [
      "invalid argument",
      "intrinsic Gas too low",
      "eth_sendRawTransaction",
    ];
    const method = async () => {
      const tx = await ethCallContract.getFunction("set").send(expectedValue, { gasLimit: 0 });
      await tx.wait();
    };
    await expectThrowsAsync(method, errMsg);
  });

  it("Eth_sendRawTransaction with insufficient balance", async () => {
    const errMsg = [
      "invalid argument",
      "insufficient balance",
      "eth_sendRawTransaction",
    ];
    const method = async () => {
      const tx = await ethCallContract.getFunction("set").populateTransaction(expectedValue);
      const deployTx = ethCallContract.deploymentTransaction()
      const to = await ethCallContract.getAddress()
      const from = deployTx.from

      const gas = await ethCallContract.getFunction("set").estimateGas(expectedValue);
      const balance = await ethers.provider.getBalance(from);
      const enoughGasPrice = balance / gas;
      const insufficientGasPrice = enoughGasPrice + 100n;

      console.log(
        `gas ${gas}, balance ${balance}, enoughGasPrice ${enoughGasPrice}, insufficientGasPrice ${insufficientGasPrice}`
      );

      const gasPrice = "0x" + insufficientGasPrice.toString(16);
      const gasLimit = "0x" + gas.toString(16);
      const sendTx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": gasLimit,
        "gasPrice": gasPrice,
        "data": tx.data
      }])
      await sendTx.wait();
    };
    await expectThrowsAsync(method, errMsg);
  });
});

/**
 * How to run this?
 * > npx hardhat test test/IntrinsicGas --network gw_devnet_v1
 */
