const { ethers, config, network } = require("hardhat");
const { expect } = require("chai");

const startingBalances = {};

before("Before testing",() => {
  it("Check the Godwoken network version", () => {
    expect(config).not.to.be.undefined;
    expect(network.config).to.not.be.undefined;

    const data = JSON.parse(JSON.stringify(network.config));
    expect(data.accounts.length).to.greaterThanOrEqual(2, 'should have set at least 2 accounts');

    const uniques = [...(new Set(data.accounts))];
    expect(data.accounts.length).to.equal(uniques.length, 'accounts should not be repeated');

    data.accounts = data.accounts.map((account) => ethers.utils.computeAddress(account));
    console.log(data);
  });

  it("Record signers' starting balance", async () => {
    const signers = await ethers.getSigners();
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      startingBalances[signer.address] = await signer.getBalance();
    }
  });
});

after(async () => {
  const signers = await ethers.getSigners();
  const signersBalances = await Promise.all(signers.map(signer => signer.getBalance()));

  console.log('Total capacity spent in the test run:');
  signers.forEach((signer, index) => {
    const balance = signersBalances[index];
    const balanceEther = ethers.utils.formatEther(balance);
    const startingBalance = startingBalances[signer.address] || balance;
    const spent = balance.sub(startingBalance);
    const spentEther = ethers.utils.formatEther(spent);
    const mark = spent.gte(0) ? '+' : '';

    console.log(`${signer.address} spent: ${mark}${spentEther} pCKB (${spent}), balance: ${balanceEther} pCKB`);
  });
});
