const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Calc contract", function () {
    it("Deployment computing contract", async function () {
        const Storage = await ethers.getContractFactory("Calc");
        const contract = await Storage.deploy();
        await contract.deployed()

        //Set data
        const i = await contract.store(256);
        await i.wait();

        //Read data
        const number = await contract.retrieve();
        expect(number).to.equal(256);

        /**
         * Calculate addition & subtraction
         */
        const sum = await contract.add(8, 6);
        expect(sum).to.equal(14);

        const sub = await contract.sub(8, 6);
        expect(sub).to.equal(2);
    });
});

/**
 * How to run this test?
 * > npx hardhat test test/Calc --network gw_devnet_v1
 */
