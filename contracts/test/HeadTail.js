const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

const BET_VALUE = BigInt(10 ** 3);
const MINIMUM_USER_BALANCE_FOR_TESTING = BET_VALUE * BigInt(10);

describe('HeadTail', () => {
  if (isGwMainnetV1()) {
    return;
  }

  let provider = ethers.provider;

  let userOne;
  let userTwo;

  function createChoiceHash(choice, secret) {
    return ethers.solidityPackedKeccak256(['bool', 'string'], [choice, secret]);
  }

  async function createChoiceSignature(signer, choice, secret) {
    const choiceHash = createChoiceHash(choice, secret);

    const messageHashBytes = ethers.getBytes(choiceHash);

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
    await contract.waitForDeployment();
    return contract;
  }

  describe('Setup test', () => {
    it('deploys contract', async () => {
      const contract = await deployHeadTailContract('0x', 0);
      const address = await contract.getAddress()
      expect(address).to.be.lengthOf(42);
    });

    it('has valid initial values', async () => {
      const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

      const contract = await deployHeadTailContract('0x', 0);

      expect(await contract.getFunction("userOneAddress").staticCall()).to.be.equal(userOne.address);
      expect(await contract.getFunction("userTwoAddress").staticCall()).to.be.equal(EMPTY_ADDRESS);
    });
  });

  describe('Stage 1', () => {
    it('allows to deposit BET_VALUE', async () => {
      const contract = await deployHeadTailContract('0x', BET_VALUE);

      const tx = contract.deploymentTransaction();
      const receipt = await provider.getTransactionReceipt(tx.hash);

      expect(receipt.status === 1, 'deposit successful');
      expect(tx.value === BET_VALUE, 'deposit amount correct');
    });

    it('saves address of user', async () => {
      const contract = await deployHeadTailContract('0x', 0);

      expect(await contract.getFunction("userOneAddress").staticCall()).to.be.equal(userOne.address);
    });

    it('allows depositing 777 wei', async () => {
      const contarct = await deployHeadTailContract('0x', BigInt(777));

      const tx = contarct.deploymentTransaction();
      const receipt = await provider.getTransactionReceipt(tx.hash);

      expect(receipt.status === 1, 'deposit successful');
      expect(tx.value === BET_VALUE, 'deposit amount correct');
    });
  });

  describe('Stage 2', () => {
    it('allows to save both users addresses', async () => {
      const contract = await deployHeadTailContract('0x', BET_VALUE);

      expect(await contract.getFunction("userOneAddress").staticCall()).to.be.equal(userOne.address);

      const tx = await contract.connect(userTwo).getFunction("depositUserTwo").send(true, {
        value: BET_VALUE
      });
      await tx.wait();

      expect(await contract.getFunction("userTwoAddress").staticCall()).to.be.equal(userTwo.address);
    });
  });

  describe('Stage 5', () => {
    it('sends ether to a second user after a correct guess', async () => {
      const userOneChoice = true;
      const userOneChoiceSecret = '312d35asd454asddasddd2344124444444fyguijkfdr4';

      const { signature } = await createChoiceSignature(userOne, userOneChoice, userOneChoiceSecret);

      const contract = await deployHeadTailContract(signature, BET_VALUE);
      expect(await contract.getFunction("userOneAddress").staticCall()).to.be.equal(userOne.address);

      const tx = await contract.connect(userTwo).getFunction("depositUserTwo").send(true, { value: BET_VALUE });
      await tx.wait();

      const tx1 = await contract.getFunction("revealUserOneChoice").send(userOneChoice, userOneChoiceSecret);
      const receipt = await tx1.wait();

      const event = receipt.logs.find(logs => logs.fragment.name === 'Result');
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
