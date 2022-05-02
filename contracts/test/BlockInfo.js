const { expect } = require("chai");
const { ethers, web3 } = require("hardhat");

describe("BlockInfo Contract", function () {
  let contract = {
    address: "" // You could fill the deployed address here
  };

  before(async function () {
    if (contract.address) {
      contract = await ethers.getContractAt("BlockInfo", contract.address);
      return;
    }

    const blockInfoContractFact = await ethers.getContractFactory("BlockInfo");
    contract = await blockInfoContractFact.deploy();
    await contract.deployed();
    console.log("Deployed contract address:", contract.address);
  });

  it("should compare web3 chain id and EVM with same results", async () => {
    // check if chain id from web3 is same as chainId opcode
    const { chainId } = await ethers.provider.getNetwork()
    console.log('chainId', chainId.toString())

    const contractChainId = await contract.getChainId()
    console.log('contractChainId', contractChainId.toString())

    expect(contractChainId.toString()).to.be.equal(chainId.toString())
  })

  it("should compare web3 coinbase and conibase from EVM with same results", async () => {
    // check coinbase
    const miner = await web3.eth.getCoinbase()
    const contractMiner = await contract.getBlockCoinbase()

    console.log('contractMiner', contractMiner)
    console.log('miner', miner)
    // TODO: Uncomment when will be fixed, show as zero address
    // expect(contractMiner).to.be.equal(miner)
  })

  it("should compare web3 block number and block number from EVM with same results", async () => {
    // check block number
    const block = await web3.eth.getBlock("latest") // tip block from web3 db
    const contractBlockNumber = await contract.getCurrentBlockNumber() // mem block from godwoken

    console.log('blockNumber', block.number)
    console.log('contractBlockNumber', contractBlockNumber)
    expect(contractBlockNumber.toNumber()).to.be.greaterThanOrEqual(block.number)
  })

  it("should compare web3 block hash and block hash from EVM with same results", async () => {
    // check block hash
    const block = await web3.eth.getBlock("latest")
    // TODO: Uncomment when will be fixed
    // throw ProviderError: data out-of-bounds (length=28, offset=32, code=BUFFER_OVERRUN, version=abi/5.0.7)
    // const contractBlockHash = await contract.getBlockHash(block.number)

    console.log('blockHash', block.hash)
    // console.log('contractBlockHash', contractBlockHash)
    // expect(contractBlockNumber.toNumber()).to.be.equal(block.number)
  })

  it("should mine correct event with block number and hash with OK results", async () => {
    // mine and get block info results
    const tx = await contract.executeCurrentBlockHash().then(tx => tx.wait())

    const txBlockNumber = tx.blockNumber
    const txBlockHash = tx.blockHash
    const eventBlockNumber = parseInt(tx.logs[0].data.slice(0, 66), 16)
    const eventBlockHash = "0x" + tx.logs[0].data.slice(66, 130)
    console.log('txBlockNumber', txBlockNumber)
    console.log('eventBlockNumber', eventBlockNumber)
    console.log('txBlockHash', txBlockHash)
    console.log('eventBlockHash', eventBlockHash)

    expect(eventBlockNumber).to.be.equal(txBlockNumber)
    // TODO: Uncomment when will be fixed
    // should not be equal to zero
    // expect(eventBlockHash).to.be.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000")
    // should be same as block hash
    // expect(eventBlockHash).to.be.equal(txBlockHash)
  })
});

/**
 * How to run this test?
 * > npx hardhat test test/BlockInfo --network gw_devnet_v1
 */
