const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require("../utils/network");
const {
  BlockInfo: mainnetContractAddr,
} = require("../config/mainnet-contracts.json");
const crypto = require("crypto");
const fetch = require("cross-fetch");

describe("Eip1898 eth_getCode test", function () {
  let contract = {
    address: "", // You could fill the deployed address here
  };
  const expectEmptyCode = "0x";

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
    await contract.deployTransaction.wait(2);
    console.log("Deployed contract address:", contract.address);
  });

  it(`eth_getCode [ "0x<address>", { "blockNumber": "0x0" }`, async () => {
    const resJson = await ethGetCode(contract.address, {
      blockNumber: "0x0",
    });
    expect(resJson.result).to.be.equal(expectEmptyCode);
  });

  it(`eth_getCode [ "0x<address>", { "blockHash": "genesis block hash" }`, async () => {
    const genesisBlock = await contract.provider.getBlock("0x0");
    const resJson = await ethGetCode(contract.address, {
      blockHash: genesisBlock.hash,
    });
    expect(resJson.result).to.be.equal(expectEmptyCode);
  });

  it(`eth_getCode [ "0x<address>", { "blockHash": "genesis block hash", , "requireCanonical": false }`, async () => {
    const genesisBlock = await contract.provider.getBlock("0x0");
    const resJson = await ethGetCode(contract.address, {
      blockHash: genesisBlock.hash,
      requireCanonical: false,
    });
    expect(resJson.result).to.be.equal(expectEmptyCode);
  });

  it(`eth_getCode [ "0x<address>", { "blockHash": "genesis block hash", , "requireCanonical": true }`, async () => {
    const genesisBlock = await contract.provider.getBlock("0x0");
    const resJson = await ethGetCode(contract.address, {
      blockHash: genesisBlock.hash,
      requireCanonical: true,
    });
    expect(resJson.result).to.be.equal(expectEmptyCode);
  });

  it(`eth_getCode [ "0x<address>", { "blockHash": "0x<non-existent-block-hash>" }`, async () => {
    const randomHash = "0x" + crypto.randomBytes(32).toString("hex");
    const resJson = await ethGetCode(contract.address, {
      blockHash: randomHash,
    });
    expect(resJson.error.message).to.be.include("Header not found");
  });

  it(`eth_getCode [ "0x<address>", { "blockHash": "latest block hash", "requireCanonical": true }`, async () => {
    const latestBlock = await contract.provider.getBlock("latest");
    const resJson = await ethGetCode(contract.address, {
      blockHash: latestBlock.hash,
      requireCanonical: true,
    });
    expect(resJson.result).to.not.equal(null);
    expect(resJson.result.length).to.equal(1990);
    expect(resJson.result.startsWith("0x")).to.equal(true);
  });
});

// ethers doesn't support eip1898, so we use fetch to request json rpc
async function ethGetCode(
  address,
  { blockNumber, blockHash, requireCanonical }
) {
  const id = "0x" + crypto.randomBytes(4).toString("hex");
  let body;
  if (requireCanonical != null) {
    if (blockNumber != null) {
      body =
        '{"jsonrpc": "2.0", "method":"eth_getCode", "params": ["' +
        address +
        '", {"blockNumber": "' +
        blockNumber +
        '", "requireCanonical": ' +
        requireCanonical +
        '}], "id": "'+id+'"}';
    } else if (blockHash != null) {
      body =
        '{"jsonrpc": "2.0", "method":"eth_getCode", "params": ["' +
        address +
        '", {"blockHash": "' +
        blockHash +
        '", "requireCanonical": ' +
        requireCanonical +
        '}], "id": "'+id+'"}';
    } else {
      throw new Error("blockNumber and blockHash must be given at least one");
    }
  } else {
    if (blockNumber != null) {
      body =
        '{"jsonrpc": "2.0", "method":"eth_getCode", "params": ["' +
        address +
        '", {"blockNumber": "' +
        blockNumber +
        '"}], "id": "'+id+'"}';
    } else if (blockHash != null) {
      body =
        '{"jsonrpc": "2.0", "method":"eth_getCode", "params": ["' +
        address +
        '", {"blockHash": "' +
        blockHash +
        '"}], "id": "'+id+'"}';
    } else {
      throw new Error("blockNumber and blockHash must be given at least one");
    }
  }

  const response = await fetch(network.config.url, {
    body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const resJson = await response.json();
  return resJson;
}

/**
 * How to run this test?
 * > npx hardhat test test/Eip1898 --network gw_devnet_v1
 */
