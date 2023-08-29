const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require("../utils/network");
const { BlockInfo: mainnetContractAddr } = require("../config/mainnet-contracts.json");

describe("BlockInfo Contract", function () {
  let contract = {
    address: "" // You could fill the deployed address here
  };

  if (isGwMainnetV1()) {
    contract.address = mainnetContractAddr;
  }

  before(async function () {
    if (contract.address) {
      contract = await ethers.getContractAt("BlockInfo", contract.address);
      return;
    }

    const blockInfoContractFact = await ethers.getContractFactory("BlockInfo");
    contract = await blockInfoContractFact.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("Deployed contract address:", address);
  });

  it("should compare web3 chain id and EVM with same results", async () => {
    // check if chain id from web3 is same as chainId opcode
    const { chainId } = await ethers.provider.getNetwork()
    console.log('chainId', chainId.toString())

    const contractChainId = await contract.getChainId()
    console.log('contractChainId', contractChainId.toString())

    expect(contractChainId.toString()).to.be.equal(chainId.toString())
  })

  it("should compare web3 coinbase and coinbase from EVM with same results", async () => {
    // check coinbase
    const miner = (await ethers.provider.getBlock("latest")).miner
    const contractMiner = await contract.getFunction("getBlockCoinbase").staticCall()

    console.log('miner', miner)
    console.log('contractMiner', contractMiner)
    expect(contractMiner).to.be.equal(miner)
  })

  it("should compare web3 block number and block number from EVM with same results", async () => {
    // check block number
    const block = await ethers.provider.getBlock("latest") // tip block from web3 db
    const contractBlockNumber = await contract.getFunction("getCurrentBlockNumber").staticCall() // mem block from godwoken

    console.log('blockNumber', block.number)
    console.log('contractBlockNumber', contractBlockNumber)
    expect(contractBlockNumber).to.be.greaterThanOrEqual(block.number)
  })

  it("should compare web3 block hash and block hash from EVM with same results", async () => {
    // check block hash
    const blockNumber = await ethers.provider.getBlockNumber() - 1;
    const block = await ethers.provider.getBlock(blockNumber)
    // TODO: Uncomment when will be fixed
    // throw ProviderError: data out-of-bounds (length=28, offset=32, code=BUFFER_OVERRUN, version=abi/5.0.7)
    const contractBlockHash = await contract.getBlockHash(block.number)

    console.log('blockHash', block.hash)
    console.log('contractBlockHash', contractBlockHash)
    expect(contractBlockHash).to.be.equal(block.hash)
  })

  it("should mine correct event with block number and hash with OK results", async () => {
    // mine and get block info results
    const tx = await contract.getFunction("executeCurrentBlockHash").send().then(tx => tx.wait())

    const txBlockNumber = tx.blockNumber
    const txBlockHash = tx.blockHash
    const eventBlockNumber = parseInt(tx.logs[0].data.slice(0, 66), 16)
    const eventBlockHash = "0x" + tx.logs[0].data.slice(66, 130)
    console.log('txBlockNumber', txBlockNumber)
    console.log('eventBlockNumber', eventBlockNumber)
    console.log('txBlockHash', txBlockHash)
    console.log('eventBlockHash', eventBlockHash)

    expect(eventBlockNumber).to.be.equal(txBlockNumber)
    // should be equal to zero
    expect(eventBlockHash).to.be.equal("0x0000000000000000000000000000000000000000000000000000000000000000")


    // Triggering the event for the previous block hash
    const prevTx = await contract.getFunction("executePreviousBlockHash").send().then(tx => tx.wait());

    const prevTxBlockNumber = prevTx.blockNumber - 1;
    const prevTxBlockHash = (await ethers.provider.getBlock(prevTxBlockNumber)).hash;
    const prevEventBlockNumber = parseInt(prevTx.logs[0].data.slice(0, 66), 16);
    const prevEventBlockHash = "0x" + prevTx.logs[0].data.slice(66, 130);
    console.log('prevTxBlockNumber', prevTxBlockNumber)
    console.log('prevEventBlockNumber', prevEventBlockNumber)
    console.log('prevTxBlockHash', prevTxBlockHash)
    console.log('prevEventBlockHash', prevEventBlockHash)

    // should be same as block hash
    expect(prevEventBlockNumber).to.be.equal(prevTxBlockNumber);
    expect(prevEventBlockHash).to.be.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    expect(prevEventBlockHash).to.be.equal(prevTxBlockHash);
  })
});

/**
 * How to run this test?
 * > npx hardhat test test/BlockInfo --network gw_devnet_v1
 */
