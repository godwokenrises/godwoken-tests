const {expect} = require("chai");
const {isGwMainnetV1} = require('../utils/network');
const {ethers, upgrades} = require("hardhat");

describe("ERC721MSHKUUPSTokenUpgrade", function () {
    if (isGwMainnetV1()) {
        return;
    }

    it("Deploy and call recursive functions", async () => {
        const ERC721MSHKUUPSToken = await ethers.getContractFactory("ERC721MSHKUUPSToken");

        const m = await upgrades.deployProxy(ERC721MSHKUUPSToken, {
            initializer: "initialize",  // Set a different initialization function to call
        });

        await m.deployed();

        const PROXY = m.address;

        const mV2 = await ethers.getContractFactory("ERC721MSHKUUPSTokenV2");
        var P = await upgrades.upgradeProxy(PROXY, mV2);
        expect(PROXY).to.equal(P.address);
    });
});
