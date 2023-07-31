const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const toolkit = require("@ckb-lumos/toolkit");
const {
  u32ToLittleEnd,
  getAccountIdByContractAddress,
} = require("../lib/helper");
const { isGwMainnetV1, isAxon } = require('../utils/network');
const { expectThrowsAsync } = require('../utils/throw');

const expectedValue = 10;
let ethCallContract;

const rpc = new toolkit.RPC(network.config.url);

describe("MIN GAS PRICE Test", function () {
  if (isGwMainnetV1()) {
    return;
  }

  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.deployed();
  });

  it("Eth_sendRawTransaction with no special gasPrice setting", async () => {
    const tx = await ethCallContract.set(expectedValue);
    await tx.wait();
    const receipt = await ethCallContract.provider.getTransactionReceipt(
      tx.hash
    );
    expect(receipt.status).to.equal(1);
  });

  it("Eth_sendRawTransaction with lower gasPrice", async () => {

    /**
        Axon throws a different error message:
          "Custom error: The transaction gas price is zero"
    */
    if (isAxon()) {
      return;
    }
    const p = new Array(1).fill(1).map(async () => {
      const errMsg = [
        "invalid argument",
        "minimal gas price",
        "eth_sendRawTransaction",
      ];
      const method = async () => {
        const tx = await ethCallContract.set(expectedValue, { gasPrice: 0 });
        await tx.wait();
      };
      await expectThrowsAsync(method, errMsg);
    });
    const ps = Promise.all(p);
    await ps;
  });

  it("gw_submit_l2transaction with 2000000000000000 gasPrice", async () => {
    if (isAxon()) {
      return true;
    }
    const noErrMsgKeyWords = ["minimal gas price"];
    const toId = await getAccountIdByContractAddress(
      rpc,
      ethCallContract.address
    );
    const toIdLE = u32ToLittleEnd(toId);
    const l2tx = `0xd90000000c0000009400000088000000180000002000000024000000280000002c000000e81601000000000010000000${toIdLE.slice(
      2
    )}2d03000058000000ffffff504f4c5900f47500000000000000008d49fd1a07000000000000000000000000000000000000000000000000002400000060fe47b1000000000000000000000000000000000000000000000000000000000000000a41000000c80a9c5101e5839f3b9b7181d3e0e6c163880227b04e2575bc7e01375b16d21b057313182b7adb85f9db119adb6843884e6163e944889ca6d53ce19e7f38482501`;
    const method = async () => {
      await rpc.gw_submit_l2transaction(l2tx);
    };
    await expectThrowsAsync(method, undefined, noErrMsgKeyWords);
  });

  it("gw_submit_l2transaction with 0 gasPrice", async () => {
    if (isAxon()) {
      return true;
    }
    const errMsg = [
      "invalid argument",
      "minimal gas price",
      "gw_submit_l2transaction",
    ];
    const toId = await getAccountIdByContractAddress(
      rpc,
      ethCallContract.address
    );
    const toIdLE = u32ToLittleEnd(toId);
    console.log(toIdLE);
    const lowGasL2tx = `0xd90000000c0000009400000088000000180000002000000024000000280000002c000000e81601000000000010000000${toIdLE.slice(
      2
    )}2603000058000000ffffff504f4c5900f47500000000000000000000000000000000000000000000000000000000000000000000000000002400000060fe47b1000000000000000000000000000000000000000000000000000000000000000a4100000010e0d3b550a824f8961d7ce40d71e93dc5aeeb14f1481ab11ab83532564179041a1bc095f33a32347e0d372d650616fa380590b8529e3440bf5a652efaa4258f00`;
    const method = async () => {
      await rpc.gw_submit_l2transaction(lowGasL2tx);
    };
    await expectThrowsAsync(method, errMsg);
  });
});

/**
 * How to run this?
 * > npx hardhat test test/EthCall --network gw_devnet_v1
 */
