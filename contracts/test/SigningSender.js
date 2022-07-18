const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("Signing Contract", function () {
  if (isGwMainnetV1()) {
    return;
  }

  let contract;

  beforeEach(async function () {
    const signingContract = await ethers.getContractFactory("SigningSender");
    contract = await signingContract.deploy();
    await contract.deployed();
  });

  it("should sign with address and return the same address as signer through recover", async () => {
    const [sender] = await ethers.getSigners();

    const msg = ethers.utils.keccak256(ethers.utils.RLP.encode([
      "0x80",
      [sender.address],
    ]));

    const signature = await web3.eth.sign(msg, sender.address);
    const signerAddress = await contract.recover(msg, signature)

    expect(signerAddress).to.be.equal(sender.address)
    expect(signerAddress).to.be.not.equal(ethers.constants.ZeroAddress)
  })

  it("should msgSender be the same as caller and it is OK", async () => {
    const [sender] = await ethers.getSigners();

    const msgSender = await contract.getCurrentSender();
    const txOrigin = await contract.getCurrentOrigin();
    expect(msgSender).to.be.eq(sender.address);
    expect(txOrigin).to.be.eq(sender.address);
  })

  it("should internal contract msgSender be the same as contract and it is OK", async () => {
    const [sender] = await ethers.getSigners();

    const contractSender = await contract.getContractSender();
    const txOrigin = await contract.getContractOrigin();
    const msgSender = contract.address;
    expect(msgSender).to.be.eq(contractSender);
    expect(txOrigin).to.be.eq(sender.address);
  })

  it("should library msgSender be the same as caller and it is OK", async () => {
    const [sender] = await ethers.getSigners();

    const msgSender = await contract.getLibrarySender();
    const txOrigin = await contract.getLibraryOrigin();
    expect(msgSender).to.be.eq(sender.address);
    expect(txOrigin).to.be.eq(sender.address);
  })

});
