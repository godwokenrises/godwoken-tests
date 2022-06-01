const { assert } = require("chai");
const { ethers, web3 } = require("hardhat");

describe("ContractAddress", function () {
    it("Contract address should be null when not deploy contract", async function () {
        const Storage = await ethers.getContractFactory("Calc");
        const contract = await Storage.deploy();
        await contract.deployed();

        //Set data
        const tx = await contract.store(256);
        await tx.wait(2);
        const receipt = await web3.eth.getTransactionReceipt(tx.hash);
        assert.isNull(receipt.contractAddress);
    });
});
