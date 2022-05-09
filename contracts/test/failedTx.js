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
            const accounts = await ethers.getSigners();

            // get starting balance
            const startingBalance = await provider.getBalance(accounts[0].address);

            // set gas price
            const gasPrice = 3;
            const value = 10;

            // set message
            const tx = await contract.setMsg(1, "Hello", { value: value, gasPrice: gasPrice });

            // receipt
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed;

            // check message is set
            expect(await contract.getMsg()).to.be.equal("Hello");

            // check balance is expected
            const expectedCost = gasUsed.mul(gasPrice).add(value);
            let balance = await provider.getBalance(accounts[0].address);
            assert(balance.eq(startingBalance.sub(expectedCost)), "balance");
        });
    });

    describe('Failure', () => {
        it('revert transferred value', async () => {
            const accounts = await ethers.getSigners();

            // get starting balance
            const startingBalance = await provider.getBalance(accounts[0].address);
            const startingNonce = await provider.getTransactionCount(accounts[0].address);

            // set gas price
            const gasPrice = 1;
            const value = 10;

            // set message
            const tx = await contract.setMsg(0, "Hello", { value: value, gasPrice: gasPrice, gasLimit: 10000 });

            // receipt
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed;

            // check message is set
            expect(await contract.getMsg()).to.be.equal("");

            // check balance is expected
            const expectedCost = gasUsed.mul(gasPrice);
            let balance = await provider.getBalance(accounts[0].address);
            assert(balance.eq(startingBalance.sub(expectedCost)), "balance");

            // check nonce
            const nonce = await provider.getTransactionCount(accounts[0].address);
            expect(nonce).to.be.equal(startingNonce + 1);
        });
    });

});
