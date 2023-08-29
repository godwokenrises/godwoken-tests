const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require("../utils/network");

describe("Calc contract", function () {
    if (isGwMainnetV1()) {
        return;
    }

    it("Deployment computing contract", async function () {
        const Storage = await ethers.getContractFactory("Calc");
        const contract = await Storage.deploy();
        await contract.waitForDeployment()

        //Set data
        const i = await contract.getFunction("store").send(256);
        await i.wait();

        //Read data
        const number = await contract.getFunction("retrieve").staticCall();
        expect(number).to.equal(256);

        /**
         * Calculate addition & subtraction
         */
        const sum = await contract.getFunction("add").staticCall(8, 6);
        expect(sum).to.equal(14);

        const sub = await contract.getFunction("sub").staticCall(8, 6);
        expect(sub).to.equal(2);
    });
});

/**
 * How to run this test?
 * > npx hardhat test test/Calc --network gw_devnet_v1
 */
