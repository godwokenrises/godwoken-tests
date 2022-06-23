const { config, network, ethers } = require("hardhat");
const { expect } = require("chai");

describe("Check the Godwoken network version", () => {
  expect(config).to.not.equal(undefined, 'should have config');
  expect(network.config).to.not.equal(undefined, 'should have network config');

  const data = JSON.parse(JSON.stringify(network.config));
  expect(data.accounts.length).to.greaterThanOrEqual(2, 'should have set at least 2 accounts');

  const uniques = [...(new Set(data.accounts))];
  expect(data.accounts.length).to.equal(uniques.length, 'accounts should not be repeated');

  data.accounts = data.accounts.map((account) => ethers.utils.computeAddress(account));
  console.log(data);
});
