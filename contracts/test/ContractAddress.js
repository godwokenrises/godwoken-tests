const { assert } = require("chai");
const { ethers, web3 } = require("hardhat");

describe("ContractAddress", function () {
    it("Contract address should be null when not deploy contract", async function () {
        const Storage = await ethers.getContractFactory("Calc");
        const contract = await Storage.deploy();
        await contract.deployed();

        //Set data
        const tx = await contract.store(256);
        await tx.wait();
        let receipt = await web3.eth.getTransactionReceipt(tx.hash);
        assert.isNull(receipt.contractAddress);

        // wait for block commit to ignore instant finality, until test timeout
        while (true) {
            const tipNumber = ethers.provider.blockNumber;
            receipt = await web3.eth.getTransactionReceipt(tx.hash);
            if (tipNumber >= receipt.blockNumber) {
                break;
            }
            await asyncSleep(1000);
        }
        assert.isNull(receipt.contractAddress);
    });
});

const asyncSleep = async (ms = 0) =>
    new Promise((r) => setTimeout(() => r("ok"), ms));
