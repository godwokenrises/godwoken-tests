const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

let contract;

describe('Revertable transaction', () => {
  if (isGwMainnetV1()) {
    return;
  }

  let provider = ethers.provider;

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("RevertHandling");
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  describe('Success', () => {
    it('transferred value and fee', async () => {
      // set transaction params
      const value = 10;
      const msg = 'Hello';

      // set message
      const tx = await contract.getFunction("setMsg").send(1, msg, { value });
      const receipt = await tx.wait();

      // check receipt
      expect(receipt.status).to.be.equal(1, 'transaction complete');
      expect(receipt.gasUsed > BigInt(0),'should have used gas').to.be.true;

      // check event
      const event = receipt.logs.find((row) => row.fragment.name === 'SetMsg');
      expect(event).to.not.be.undefined;

      // check event result
      const { message, amount } = event.args;
      expect(message).to.be.equal(msg, 'message is set');
      expect(amount === BigInt(value),'transferred exact amount of capacity').to.be.true;
    });
  });

  describe('Failure', () => {
    it('revert transferred value', async () => {
      // set transaction params
      const value = 10;

      // set message
      const tx = await contract.getFunction("setMsg").send(0, 'Hello', { value: value, gasLimit: 30000 });

      let receipt;
      try {
        await tx.wait()
      } catch (e) {
        receipt = e.receipt;
      }

      // check receipt
      expect(receipt).not.to.equal(undefined, "receipt should not be undefined");
      expect(receipt).not.to.equal(null, "receipt should not be null");
      expect(receipt.status).to.be.equal(0, 'transaction should be failed');
      expect(receipt.logs.length).to.be.equal(0, 'should be no relevant log');
      expect(receipt.gasUsed > BigInt(0), 'should have used gas').to.be.true;

      // check msg
      expect(await contract.getFunction("getMsg").staticCall()).to.be.equal('', 'msg should not be set');

      // check nonce
      const accounts = await ethers.getSigners();
      const nonce = await provider.getTransactionCount(accounts[0].address);
      expect(nonce).to.be.greaterThan(tx.nonce, 'current nonce should be greater than last time');
    });
  });

});
