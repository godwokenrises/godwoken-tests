const { config, network, ethers } = require("hardhat");
const assert = require("assert");

describe("Check the Godwoken network version", () => {
  assert.notEqual(config, undefined, 'should have a config field');

  const data = JSON.parse(JSON.stringify(network.config));
  assert(data.accounts.length >= 2, 'should have set 2 accounts');

  const [userOne, userTwo] = data.accounts;
  assert(userOne !== userTwo, "accounts shouldn't be repeated");
      
  // Compute accounts and display network config
  data.accounts[0] = ethers.utils.computeAddress(data.accounts[0]);
  data.accounts[1] = ethers.utils.computeAddress(data.accounts[1]);
  console.log(data);
});
