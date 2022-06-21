const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const crypto = require("crypto");
const fetch = require("node-fetch");
const toolkit = require("@ckb-lumos/toolkit");
const { utils } = require("@ckb-lumos/base");
const schemas = require("../../schemas");
const normalizers = require("../lib/normalizer");

const expectedValue = 10;

let ethCallContract;

const rpc = new toolkit.RPC(network.config.url);

const expectThrowsAsync = async (method, errMsgKeyWords) => {
  let error = null;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an("Error");
  if (errMsgKeyWords) {
    for (keyWord of errMsgKeyWords) {
      console.log(error.message);
      expect(error.message).to.include(keyWord);
    }
  }
};

const u32ToLittleEnd = (value) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return `0x${buf.toString("hex")}`;
};

const getAccountIdByContractAddress = async (contractAddress) => {
  const nodeInfo = (await rpc.poly_version()).nodeInfo;
  const polyjuiceValidatorCodeHash =
    nodeInfo.backends.polyjuice.validatorScriptTypeHash;
  const rollupTypeHash = nodeInfo.rollupCell.typeHash;
  const creator_account_id = nodeInfo.accounts.polyjuiceCreator.id;

  const script = {
    code_hash: polyjuiceValidatorCodeHash,
    hash_type: "type",
    args:
      rollupTypeHash +
      u32ToLittleEnd(+creator_account_id).slice(2) +
      contractAddress.slice(2),
  };
  const scriptHash = utils.computeScriptHash(script);
  // console.log(
  //   "script",
  //   script,
  //   "contractAddress",
  //   contractAddress,
  //   "scriptHash: ",
  //   scriptHash
  // );
  const id = await rpc.gw_get_account_id_by_script_hash(scriptHash);
  if (id == null) {
    throw new Error("toId is null!");
  }
  return id;
};

const callGwRpc = async (ethCallContract, toId, polyArgs) => {
  const chainId = (await ethCallContract.provider.getNetwork()).chainId;
  const rawL2Tx = {
    chain_id: chainId,
    from_id: "0x3",
    to_id: toId,
    nonce: "0x0",
    args: polyArgs,
  };

  const serializeRawL2Tx = new toolkit.Reader(
    schemas.SerializeRawL2Transaction(
      normalizers.NormalizeRawL2Transaction(rawL2Tx)
    )
  ).serializeJson();

  const value = await rpc.gw_execute_raw_l2transaction(serializeRawL2Tx);
  return value;
};

describe("gw_execute_raw_l2transaction Cache Test", function () {
  before("Deploy and Set", async () => {
    const contractFact = await ethers.getContractFactory("CallTest");
    ethCallContract = await contractFact.deploy();
    await ethCallContract.deployed();
    await ethCallContract.set(expectedValue);
  });

  it("batch call", async () => {
    const count = 100;
    const toId = await getAccountIdByContractAddress(ethCallContract.address);
    const args =
      "0xffffff504f4c590020bcbe00000000000000000000000000000000000000000000000000000000000000000000000000040000006d4ce63c";

    const p = new Array(count).fill(1).map(async () => {
      const value = await callGwRpc(ethCallContract, toId, args);
      return value;
    });
    const ps = Promise.all(p);
    const values = await ps;

    expect(values.length).to.equal(count);
    for (let i = 0; i < values.length; i++) {
      expect(+values[i].return_data).to.equal(expectedValue);
    }
  });

  it("batch call revert", async () => {
    const count = 100;
    const toId = await getAccountIdByContractAddress(ethCallContract.address);
    const args =
      "0xffffff504f4c590020bcbe0000000000000000000000000000000000000000000000000000000000000000000000000024000000df57407800000000000000000000000000000000000000000000000000000000000001bc";

    const p = new Array(count).fill(1).map(async () => {
      const errMsgKeyWords = ["revert: Error(you trigger death value!)"];
      const method = async () => {
        await callGwRpc(ethCallContract, toId, args);
      };
      await expectThrowsAsync(method, errMsgKeyWords);
    });
    const ps = Promise.all(p);
    await ps;
  });
});

/**
 * How to run this?
 * > npx hardhat test test/GwExecuteRawL2Tx --network gw_devnet_v1
 */
