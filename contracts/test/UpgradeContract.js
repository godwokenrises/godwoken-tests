const { expect } = require("chai");
const { isGwMainnetV1 } = require('../utils/network');
const { ethers, upgrades } = require("hardhat");

describe("ERC721MSHKUUPSTokenUpgrade", function () {
  if (isGwMainnetV1()) {
    return;
  }

  it("Contract upgrade test", async () => {
    const ERC721MSHKUUPSToken = await ethers.getContractFactory("ERC721MSHKUUPSToken");

    const m = await upgrades.deployProxy(ERC721MSHKUUPSToken, {
      initializer: "initialize",  // Set a different initialization function to call
    });

    await m.waitForDeployment();

    const PROXY = await m.getAddress();

    const mV2 = await ethers.getContractFactory("ERC721MSHKUUPSTokenV2");
    const P = await upgrades.upgradeProxy(PROXY, mV2);
    const PAddress = await P.getAddress()
    expect(PROXY).to.equal(PAddress);
  });
});
