const { isAxon } = require('../utils/network');
const { ethers, config, network } = require("hardhat");
const { expect } = require("chai");
const { RPC } = require('ckb-js-toolkit');

const startingBalances = {};


if (!isAxon()) {
  before("Before testing", () => {
    it("Check the Godwoken network version", () => {
      expect(config).not.to.be.undefined;
      expect(network.config).to.not.be.undefined;

      const data = JSON.parse(JSON.stringify(network.config));
      expect(data.accounts.length).to.greaterThanOrEqual(2, 'should have set at least 2 accounts');

      const uniques = [...(new Set(data.accounts))];
      expect(data.accounts.length).to.equal(uniques.length, 'accounts should not be repeated');

      data.accounts = data.accounts.map((account) => ethers.computeAddress(account));

      console.log("Network info:", data);
    });

    it("Log Godwoken components", async () => {
      const rpc = new RPC(network.config.url);
      const info = await rpc["poly_version"]();
      console.log("Godwoken components info:", info.versions);
    });

    it("Record signers' starting balance", async () => {
      const signers = await ethers.getSigners();
      for (let i = 0; i < signers.length; i++) {
        const signer = signers[i];
        startingBalances[signer.address] = await ethers.provider.getBalance(signer.address);
      }
    });
  });

  after(async () => {
    const signers = await ethers.getSigners();
    const signersBalances = await Promise.all(signers.map(signer => ethers.provider.getBalance(signer.address)));

    console.log('Total capacity spent in the test run:');
    signers.forEach((signer, index) => {
      const balance = signersBalances[index];
      const balanceEther = ethers.formatEther(balance);
      const startingBalance = startingBalances[signer.address] || balance;
      const spent = balance - startingBalance;
      const spentEther = ethers.formatEther(spent);
      const mark = spent >= 0 ? '+' : '';

      console.log(`${signer.address} spent: ${mark}${spentEther} pCKB (${spent}), balance: ${balanceEther} pCKB`);
    });
  });
}
