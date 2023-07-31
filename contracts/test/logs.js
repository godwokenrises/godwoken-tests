const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1, isAxon } = require("../utils/network");

// NOTE: using `tx.wait(2)` for we use instant finality for tests

describe("eth_getFilterChanges", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  // NOTE: `eth_getFilterChanges` returns a list of block hashes for a block filter, while a part of hashes
  // may not exist on the canonical chain, so `getBlock()` will return `null` for them.
  it("eth_getFilterChanges with BlockFilter", async function () {
    // 1. Create a block filter
    const filterId = await ethers.provider.send("eth_newBlockFilter", []);

    // 2. Deploy contract and make a call
    const logsProducer = await ethers.getContractFactory("LogsProducer");
    const contract = await logsProducer.deploy();
    await contract.deployed();

    const nameOfLogs = 1;
    const numberOfLogs = 1;
    const tx = await contract.produce(nameOfLogs, numberOfLogs);
    await tx.wait(2);

    // 3. eth_getFilterChanges should return a list of block hashes, check count and order(asc) of them
    const blockHashes = await ethers.provider.send("eth_getFilterChanges", [
      filterId,
    ]);
    let canonicalBlockNumbers = [];
    for (const blockHash of blockHashes) {
      const number = (await ethers.provider.getBlock(blockHash))?.number;
      if (number != null) {
        canonicalBlockNumbers.push(number);
      }
    }
    expect(canonicalBlockNumbers).deep.eq([...canonicalBlockNumbers].sort());
    expect(canonicalBlockNumbers.length).gte(2);
  });

  it("eth_getFilterChanges with filter using address and topics", async function () {
    // 1. Deploy contract
    const logsProducer = await ethers.getContractFactory("LogsProducer");
    const contract = await logsProducer.deploy();
    await contract.deployed();

    // 2. Create a filter with address and topics.
    //
    // topics: [signature of event name, $nameOfLogs, $numberOfLogs]
    const nameOfLogs = 2;
    const numberOfLogs = 2;
    const topics = contract.filters.Event(
      "0x" + nameOfLogs.toString(16).padStart(64, "0"),
      "0x" + numberOfLogs.toString(16).padStart(64, "0")
    ).topics;
    const address = contract.address;
    const fromBlock = null;
    const filterId = await ethers.provider.send("eth_newFilter", [
      { address, topics, fromBlock },
    ]);

    const fn = async () => {
      // 3. Emit $numberOfLogs logs
      const tx = await contract.produce(nameOfLogs, numberOfLogs);
      await tx.wait(2);

      // 4. We should get `$numberOfLogs` results with order(asc) by id desc
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      const receiptLogIds = receipt.logs.map((log) => log.logIndex);
      const logs = await ethers.provider.send("eth_getFilterChanges", [
        filterId,
      ]);
      expect(receiptLogIds.length).eq(numberOfLogs);
      expect(receiptLogIds).deep.eq([...receiptLogIds].sort());
      expect(receiptLogIds).deep.eq(logs.map((log) => +log.logIndex));

      // 5. eth_getFilterChanges should return [] now because the lastPoll is updated
      expect(
        await ethers.provider.send("eth_getFilterChanges", [filterId])
      ).deep.eq([]);
    };
    await fn();
    await fn();
  });
});

describe("eth_getFilterLogs", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  // NOTE: `eth_getFilterLogs` returns [] for eth_newBlockFilter
  it("eth_getFilterLogs with BlockFilter", async function () {
    // 1. Create a block filter
    const filterId = await ethers.provider.send("eth_newBlockFilter", []);

    // 2. Deploy contract and make a call
    const nameOfLogs = 3;
    const numberOfLogs = 3;
    const logsProducer = await ethers.getContractFactory("LogsProducer");
    const contract = await logsProducer.deploy();
    await contract.deployed();

    const tx = await contract.produce(nameOfLogs, numberOfLogs);
    await tx.wait(2);

    // NOTE:
    // Hardhat & Godwoken returns empty array
    // Geth returns `filter not found`
    try {
      const logs = await ethers.provider.send("eth_getFilterLogs", [filterId]);
      expect(logs).deep.eq([]);
    } catch (err) {
      expect(err.message).to.contains("filter not found");
    }
  });

  // Failed on hardhat network
  // Passed on Geth & Godwoken
  it("eth_getFilterLogs with filter using address and topics", async function () {
    // 1. Deploy contract
    const logsProducer = await ethers.getContractFactory("LogsProducer");
    const contract = await logsProducer.deploy();
    await contract.deployed();

    // 2. Create a filter with address and topics.
    //
    // topics: [signature of event name, $nameOfLogs, $numberOfLogs]
    const nameOfLogs = 2;
    const numberOfLogs = 2;
    const topics = contract.filters.Event(
      "0x" + nameOfLogs.toString(16).padStart(64, "0"),
      "0x" + numberOfLogs.toString(16).padStart(64, "0")
    ).topics;
    const address = contract.address;

    // `fromBlock` default to latest block when call `eth_getFilterLogs` in Geth
    const fromBlock = "earliest";
    const filterId = await ethers.provider.send("eth_newFilter", [
      { address, topics, fromBlock },
    ]);

    let totalReceiptLogIds = [];

    const generateLogId = (log) => `${log.transactionHash}#${+log.logIndex}`;

    const fn = async () => {
      // 3. Emit $numberOfLogs logs
      const tx = await contract.produce(nameOfLogs, numberOfLogs);
      await tx.wait(2);

      // 4. We should get `$numberOfLogs` results with order(asc) by id desc
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      const receiptLogIds = receipt.logs.map((log) => generateLogId(log));

      totalReceiptLogIds = totalReceiptLogIds.concat(receiptLogIds);

      const logs = await ethers.provider.send("eth_getFilterLogs", [filterId]);
      expect(receiptLogIds.length).eq(numberOfLogs);
      expect(receiptLogIds).deep.eq([...receiptLogIds].sort());
      expect(totalReceiptLogIds).deep.eq(logs.map((log) => generateLogId(log)));

      // 5. eth_getFilterLogs should also return receipt.logs
      const newFilterLogs = await ethers.provider.send("eth_getFilterLogs", [
        filterId,
      ]);
      expect(newFilterLogs.map((log) => generateLogId(log))).deep.eq(
        totalReceiptLogIds
      );
    };
    await fn();
    await fn();
  });
});

describe("eth_getLogs", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  it("eth_getLogs with filter using address and topics", async function () {
    // 1. Deploy contract and wait 2 blocks generated
    const logsProducer = await ethers.getContractFactory("LogsProducer");
    const contract = await logsProducer.deploy();
    await contract.deployed();

    const nameOfLogs = 4;
    const numberOfLogs = 4;
    const tx = await contract.produce(nameOfLogs, numberOfLogs);

    // Wait 2 to confirm `latest` > this block number
    await tx.wait(2);

    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    const receiptLogIds = receipt.logs.map((log) => log.logIndex);
    const receiptBlockNumber = "0x" + receipt.blockNumber.toString(16);
    const receiptBlockNumberAdd1 =
      "0x" + (receipt.blockNumber + 1).toString(16);
    expect(receiptLogIds).deep.eq([...receiptLogIds].sort());

    const topics = contract.filters.Event(
      "0x" + nameOfLogs.toString(16).padStart(64, "0"),
      "0x" + numberOfLogs.toString(16).padStart(64, "0")
    ).topics;

    const address = contract.address;
    const cases = [
      { fromBlock: undefined, toBlock: undefined, expected: [] },
      { fromBlock: "earliest", toBlock: undefined, expected: receiptLogIds },
      { fromBlock: "latest", toBlock: undefined, expected: [] },
      // NOTE:
      // Geth returns `invalid block range`
      // Hardhat & Godwoken returns []
      {
        fromBlock: "pending",
        toBlock: undefined,
        expected: [],
        orErrorMsg: "invalid block range",
      },
      {
        fromBlock: receiptBlockNumber,
        toBlock: undefined,
        expected: receiptLogIds,
      },
      { fromBlock: receiptBlockNumberAdd1, toBlock: undefined, expected: [] },
      { fromBlock: undefined, toBlock: "earliest", expected: [] },
      {
        fromBlock: "earliest",
        toBlock: receiptBlockNumber,
        expected: receiptLogIds,
      },
      {
        fromBlock: receiptBlockNumber,
        toBlock: receiptBlockNumber,
        expected: receiptLogIds,
      },
      {
        fromBlock: receiptBlockNumberAdd1,
        toBlock: receiptBlockNumber,
        expected: [],
      },
      {
        fromBlock: undefined,
        toBlock: undefined,
        blockHash: receipt.blockHash,
        expected: receiptLogIds,
      },
    ];
    for (const {
      fromBlock,
      toBlock,
      blockHash,
      expected,
      orErrorMsg,
    } of cases) {
      const filter = { address, topics, fromBlock, toBlock, blockHash };
      try {
        const logs = await ethers.provider.send("eth_getLogs", [filter]);
        expect(logs.length, `filter: ${JSON.stringify(filter)}`).eq(
          expected.length
        );
        expect(
          logs.map((log) => +log.logIndex),
          `filter: ${JSON.stringify(filter)}`
        ).deep.eq(expected);
      } catch (err) {
        if (orErrorMsg) {
          expect(err.message).to.contains(orErrorMsg);
        } else {
          throw err;
        }
      }
    }
  });
});
