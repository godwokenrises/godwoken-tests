const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

const BET_VALUE = BigInt(1 * 10 ** 3);
const MINIMUM_USER_BALANCE_FOR_TESTING = BET_VALUE * BigInt(10);

describe('HeadTail', () => {
    if (isGwMainnetV1()) {
        return;
    }

    let provider = waffle.provider;

    let userOne;
    let userTwo;

    function createChoiceHash(choice, secret) {
        return ethers.utils.solidityKeccak256(['bool', 'string'], [choice, secret]);
    }
    
    async function createChoiceSignature(signer, choice, secret) {
        const choiceHash = createChoiceHash(choice, secret);
    
        const messageHashBytes = ethers.utils.arrayify(choiceHash);
    
        const signature = await signer.signMessage(messageHashBytes);
    
        return {
            choiceHash,
            signature
        };
    }

    before(async () => {
        const users = await ethers.getSigners();

        userOne = users[0];
        userTwo = users[1];
    });

    async function deployHeadTailContract(signedChoiceHash, stake) {
        const contractFact = await ethers.getContractFactory("HeadTail");
        const contract = await contractFact.deploy(signedChoiceHash, stake, {
            value: stake,
        });
        await contract.deployed();
        return contract;
    }
 
    describe('Setup test', () => {
        it('deploys contract', async () => {
            const contract = await deployHeadTailContract('0x', 0);
            expect(contract.address).to.be.lengthOf(42);
        });

        it('has valid initial values', async () => {
            const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

            const contract = await deployHeadTailContract('0x', 0);

            expect(await contract.userOneAddress()).to.be.equal(userOne.address);
            expect(await contract.userTwoAddress()).to.be.equal(EMPTY_ADDRESS);
        });
    });

    describe('Stage 1', () => {
        it('allows to deposit BET_VALUE', async () => {
            const contarct = await deployHeadTailContract('0x', BET_VALUE);

            const tx = contarct.deployTransaction;
            const receipt = await provider.getTransactionReceipt(tx.hash);

            expect(receipt.status === 1, 'deposit successful');
            expect(tx.value.eq(BET_VALUE), 'deposit amount correct');
        });

        it('saves address of user', async () => {
            const contract = await deployHeadTailContract('0x', 0);

            expect(await contract.userOneAddress()).to.be.equal(userOne.address);
        });

        it('allows depositing 777 wei', async () => {
            const contarct = await deployHeadTailContract('0x', BigInt(777));

            const tx = contarct.deployTransaction;
            const receipt = await provider.getTransactionReceipt(tx.hash);

            expect(receipt.status === 1, 'deposit successful');
            expect(tx.value.eq(BET_VALUE), 'deposit amount correct');
        });
    });

    describe('Stage 2', () => {
        it('allows to save both users addresses', async () => {
            const contract = await deployHeadTailContract('0x', BET_VALUE);

            expect(await contract.userOneAddress()).to.be.equal(userOne.address);

            const tx = await contract.connect(userTwo).depositUserTwo(true, {
                value: BET_VALUE
            });
            await tx.wait();

            expect(await contract.userTwoAddress()).to.be.equal(userTwo.address);
        });
    });

    describe('Stage 5', () => {
        it('sends ether to a second user after a correct guess', async () => {
            const userOneChoice = true;
            const userOneChoiceSecret = '312d35asd454asddasddd2344124444444fyguijkfdr4';

            const { signature } = await createChoiceSignature(userOne, userOneChoice, userOneChoiceSecret);

            const contract = await deployHeadTailContract(signature, BET_VALUE);
            expect(await contract.userOneAddress()).to.be.equal(userOne.address);

            const tx = await contract.connect(userTwo).depositUserTwo(true, { value: BET_VALUE });
            await tx.wait();

            const tx1 = await contract.revealUserOneChoice(userOneChoice, userOneChoiceSecret);
            const receipt = await tx1.wait();

            const event = receipt.events.find(event => event.event === 'Result');
            expect(event).to.not.equal(void 0, 'should have a Result event');

            const { userOneBalanceDiff, userTwoBalanceDiff } = event.args;
            expect(userOneBalanceDiff).to.be.equal(0, 'user one loses and gets 0 reward');
            expect(userTwoBalanceDiff).to.be.equal(BET_VALUE * 2n, 'user two wins and gets double the BET_VALUE as reward');
        });
    });
});

/**
 * How to run this?
 * > npx hardhat test test/HeadTail --network gw_devnet_v1
 */
