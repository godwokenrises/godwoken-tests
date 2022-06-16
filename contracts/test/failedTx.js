const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

let contract;

describe('Revertable transaction', () => {
    let provider = waffle.provider;

    beforeEach(async function () {
        const factory = await ethers.getContractFactory("RevertHandling");
        contract = await factory.deploy();
        await contract.deployed();
    });

    describe('Success', () => {
        it('transferred value and fee', async () => {
            // set gas price
            const gasPrice = 3;
            const value = 10;

            // set message
            const tx = await contract.setMsg(1, "Hello", { value, gasPrice });

            // receipt
            const receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);

            // check message is set
            expect(await contract.getMsg()).to.be.equal("Hello");

            // check total cost is expected
            const expectedCost = receipt.gasUsed.mul(gasPrice).add(value);
            const eventuallyCost = receipt.gasUsed.mul(tx.gasPrice).add(tx.value);
            assert(expectedCost.eq(eventuallyCost), "expected cost");
        });
    });

    describe('Failure', () => {
        it('revert transferred value', async () => {
            const accounts = await ethers.getSigners();

            // get starting nonce
            const startingNonce = await provider.getTransactionCount(accounts[0].address);

            // set gas price
            const gasPrice = 1;
            const value = 10;

            // set message
            const tx = await contract.setMsg(0, "Hello", { value: value, gasPrice: gasPrice, gasLimit: 30000 });

            // receipt
            const receipt = await provider.getTransactionReceipt(tx.hash);
            expect(receipt.status).to.be.equal(0);
            expect(receipt.logs.length).to.be.equal(0);

            // check message is unchanged
            expect(await contract.getMsg()).to.be.equal("");

            // check balance is expected
            const expectedCost = receipt.gasUsed.mul(gasPrice);
            const eventuallyCost = receipt.gasUsed.mul(tx.gasPrice);
            assert(expectedCost.eq(eventuallyCost), "expected cost");

            // check nonce
            const nonce = await provider.getTransactionCount(accounts[0].address);
            expect(nonce).to.be.equal(startingNonce + 1);
        });
    });

});
