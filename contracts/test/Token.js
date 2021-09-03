const { ethers } = require("hardhat");
const { expect } = require("chai");
const { parseUnits } = require("ethers/lib/utils");
const { BigNumber } = require("ethers");

describe("Deployment ERC20", function () {
  it("user-defined decimals", async function () {
    // const [owner] = await ethers.getSigners();

    const Erc20TokenFact = await ethers.getContractFactory("ERC20");
    console.log("encodeDeploy:", Erc20TokenFact.interface.encodeDeploy([
      "erc20_decimals",
      "DEC",
      BigNumber.from(9876543210),
      1,
      8])
    );

    // const hardhatToken = await Erc20Token.deploy();
    const hardhatToken = await Erc20TokenFact.deploy(
      "erc20_decimals",
      "DEC",
      BigNumber.from(9876543210),
      1,
      8
    );
    console.log("call decimals:", Erc20TokenFact.interface.encodeFunctionData("decimals"));

    expect(await hardhatToken.totalSupply()).to.equal(9876543210);
  });
});
