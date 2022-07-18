const { ethers, config, network } = require("hardhat");
const { expect } = require("chai");

let startingBalances = [];

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
    startingBalances = await Promise.all(signers.map(signer => signer.getBalance()));
  });
});

after(async () => {
  const signers = await ethers.getSigners();
  const signersBalances = await Promise.all(signers.map(signer => signer.getBalance()));
  const finalBalances = signers.map((signer, index) => {
    const spent = signersBalances[index].sub(startingBalances[index]);
    const spentEther = ethers.utils.formatEther(spent);
    const mark = spent.gte(0) ? '+' : '';
    return {
      address: signer.address,
      spentEther,
      spent,
      mark,
    };
  });

  console.log('Total capacity changed in the test run:');
  finalBalances.forEach((row) => {
    console.log(`${row.address} spent ${row.mark}${row.spentEther} pCKB (${row.spent} capacity)`);
  });
});