const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const BET_VALUE = BigInt(1 * 10 ** 3);
const MINIMUM_USER_BALANCE_FOR_TESTING = BET_VALUE * BigInt(10);

describe('HeadTail', () => {
    let provider = waffle.provider;

    let userOne;
    let userTwo;

    const getBalance = async (address) => provider.getBalance(address);
    const getBalanceAsString = async (address) => (await getBalance(address)).toString();

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
            gasPrice: 0,
            gasLimit: 10000000
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
            const startingBalance = await getBalance(userOne.address);

            await deployHeadTailContract('0x', BET_VALUE);

            expect(await getBalanceAsString(userOne.address)).to.be.equal(
                startingBalance.sub(BET_VALUE).toString()
            );
        });

        it('saves address of user', async () => {
            const contract = await deployHeadTailContract('0x', 0);

            expect(await contract.userOneAddress()).to.be.equal(userOne.address);
        });

        it('allows depositing 777 wei', async () => {
            const startingBalance = await getBalance(userOne.address);

            await deployHeadTailContract('0x', BigInt(777));

            expect(await getBalanceAsString(userOne.address)).to.be.equal(
                startingBalance.sub(777).toString()
            );
        });
    });

    describe('Stage 2', () => {
        it('allows to save both users addresses', async () => {
            const contract = await deployHeadTailContract('0x', BET_VALUE);

            expect(await contract.userOneAddress()).to.be.equal(userOne.address);

            await contract.connect(userTwo).depositUserTwo(true, {
                value: BET_VALUE
            });

            expect(await contract.userTwoAddress()).to.be.equal(userTwo.address);
        });
    });

    describe('Stage 5', () => {
        it('sends ether to a second user after a correct guess', async () => {
            const startingUserOneBalance = await getBalance(userOne.address);
            const startingUserTwoBalance = await getBalance(userTwo.address);

            const userOneChoice = true;
            const userOneChoiceSecret = '312d35asd454asddasddd2344124444444fyguijkfdr4';

            const { signature } = await createChoiceSignature(
                userOne,
                userOneChoice,
                userOneChoiceSecret
            );

            contract = await deployHeadTailContract(signature, BET_VALUE);

            expect(await contract.userOneAddress()).to.be.equal(userOne.address);

            await contract.connect(userTwo).depositUserTwo(true, {
                gasPrice: 0,
                value: BET_VALUE
            });

            await contract.revealUserOneChoice(userOneChoice, userOneChoiceSecret, {
                gasPrice: 0,
                gasLimit: 10000000
            });

            expect(await getBalanceAsString(userOne.address)).to.be.equal(
                startingUserOneBalance.sub(BET_VALUE).toString(),
                'user one lost BET_VALUE in a bet'
            );

            expect(await getBalanceAsString(userTwo.address)).to.be.equal(
                startingUserTwoBalance.add(BET_VALUE).toString(),
                'user two won BET_VALUE in a bet'
            );
        });
    });
});

/**
 * How to run this?
 * > npx hardhat test test/HeadTail --network gw_devnet_v1
 */
