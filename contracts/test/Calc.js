const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Calc contract", function () {
    it("Deployment computing contract", async function () {
        const [owner] = await ethers.getSigners();
        const Storage = await ethers.getContractFactory("Calc");
        const storage = await Storage.deploy();

        //Set data
        await storage.store(256);

        //Read data
        const number = await storage.retrieve();
        expect(number).to.equal(256);

        /**
         * Calculate addition & subtraction
         */
        const sum = await storage.add(8, 6);
        expect(sum).to.equal(14);

        const sub = await storage.sub(8, 6);
        expect(sub).to.equal(2);
    });
});

/**
 * How to run this test?
 * > npx hardhat test test/Calc --network gw_devnet_v1
 */
