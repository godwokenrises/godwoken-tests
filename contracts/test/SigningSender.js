const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("Signing Contract", function () {
  if (isGwMainnetV1()) {
    return;
  }

  let contract;

  beforeEach(async function () {
    const signingContract = await ethers.getContractFactory("SigningSender");
    contract = await signingContract.deploy();
    await contract.waitForDeployment();
  });

  it("should sign with address and return the same address as signer through recover", async () => {
    const [sender] = await ethers.getSigners();

    const msgHash = ethers.keccak256(ethers.encodeRlp([
      "0x80",
      [sender.address],
    ]));

    // https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
    const signature = await ethers.provider.send("eth_sign", [sender.address, msgHash])
    const signerAddress = await contract.getFunction("recover").staticCall(msgHash, signature)
    expect(signerAddress).to.be.equal(sender.address)
    expect(signerAddress).to.be.not.equal(ethers.ZeroAddress)
  })

  it("should msgSender be the same as caller and it is OK", async () => {
    const [sender] = await ethers.getSigners();

    const msgSender = await contract.getFunction("getCurrentSender").staticCall();
    const txOrigin = await contract.getFunction("getCurrentOrigin").staticCall();
    expect(msgSender).to.be.eq(sender.address);
    expect(txOrigin).to.be.eq(sender.address);
  })

  it("should internal contract msgSender be the same as contract and it is OK", async () => {
    const [sender] = await ethers.getSigners();

    const contractSender = await contract.getFunction("getContractSender").staticCall();
    const txOrigin = await contract.getFunction("getContractOrigin").staticCall();
    const msgSender = await contract.getAddress();
    expect(msgSender).to.be.eq(contractSender);
    expect(txOrigin).to.be.eq(sender.address);
  })

  it("should library msgSender be the same as caller and it is OK", async () => {
    const [sender] = await ethers.getSigners();

    const msgSender = await contract.getFunction("getLibrarySender").staticCall();
    const txOrigin = await contract.getFunction("getLibraryOrigin").staticCall();
    expect(msgSender).to.be.eq(sender.address);
    expect(txOrigin).to.be.eq(sender.address);
  })

});
