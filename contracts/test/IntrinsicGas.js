const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');
const { expectThrowsAsync } = require('../utils/throw');

const expectedValue = 10;
let ethCallContract;

describe("MIN GAS PRICE Test", function () {
  if (isGwMainnetV1()) {
    return;
  }

  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.deployed();
  });

  it("Eth_sendRawTransaction with no special gasLimit setting", async () => {
    const tx = await ethCallContract.set(expectedValue);
    await tx.wait();
    const receipt = await ethCallContract.provider.getTransactionReceipt(
      tx.hash
    );
    expect(receipt.status).to.equal(1);
  });

  it("Eth_sendRawTransaction with 0 gasLimit", async () => {
    const errMsg = [
      "invalid argument",
      "intrinsic Gas too low",
      "eth_sendRawTransaction",
    ];
    const method = async () => {
      const tx = await ethCallContract.set(expectedValue, { gasLimit: 0 });
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
      const tx = await ethCallContract.populateTransaction.set(expectedValue);
      const address = await ethCallContract.signer.getAddress();

      const gas = await ethCallContract.provider.estimateGas(tx);
      const balance = await ethCallContract.provider.getBalance(address);
      const enoughGasPrice = BigInt(balance) / BigInt(gas);
      const insufficientGasPrice = enoughGasPrice + 100n;

      console.log(
        `gas ${gas}, balance ${balance}, enoughGasPrice ${enoughGasPrice}, insufficientGasPrice ${insufficientGasPrice}`
      );

      const gasPrice = "0x" + insufficientGasPrice.toString(16);
      const gasLimit = gas;
      tx.gasPrice = gasPrice;
      tx.gasLimit = gasLimit;
      await ethCallContract.signer.sendTransaction(tx);
    };
    await expectThrowsAsync(method, errMsg);
  });
});

/**
 * How to run this?
 * > npx hardhat test test/IntrinsicGas --network gw_devnet_v1
 */
