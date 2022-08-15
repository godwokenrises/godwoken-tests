const { assert } = require("chai");
const hardhat = require("hardhat");
const rlp = require("rlp");
const keccak256 = require("keccak256");
const { key } = require("@ckb-lumos/hd");
const hardhatConfig = require("../hardhat.config");

const { ethers } = hardhat;

describe("Non eip155 tx", function () {
  it("Send non eip155 tx", async function () {
    const [owner] = await ethers.getSigners();

    const ConsoleContract = await ethers.getContractFactory("Storage");
    const txRequest = ConsoleContract.getDeployTransaction();

    // non-eip155 tx
    // (nonce, gasprice, startgas, to, value, data)
    const nonce = await owner.getTransactionCount();
    const gasPrice = await owner.getGasPrice();
    const gasLimit = await owner.estimateGas(txRequest);
    const to = "0x";
    const value = 0;
    const data = txRequest.data?.toString();

    const rlpData = [
      nonce,
      gasPrice.toBigInt(),
      gasLimit.toBigInt(),
      to,
      value,
      data,
    ];
    const rlpEncoded = rlp.encode(rlpData);

    const message = "0x" + keccak256(Buffer.from(rlpEncoded)).toString("hex");
    const ownerPrivateKey =
      hardhatConfig.networks?.[hardhat.network.name]?.accounts[0];
    const signature = key.signRecoverable(message, ownerPrivateKey);

    const r = "0x" + signature.slice(2, 66);
    const s = "0x" + signature.slice(66, 130);
    const v = +("0x" + signature.slice(130, 132));
    assert(v === 0 || v === 1);

    const rawTransactionData = [
      nonce,
      gasPrice.toBigInt(),
      gasLimit.toBigInt(),
      to,
      value,
      data,
      v + 27,
      BigInt(r),
      BigInt(s),
    ];
    const rawTransaction =
      "0x" + Buffer.from(rlp.encode(rawTransactionData)).toString("hex");
    const sendResult = await owner.provider?.sendTransaction(rawTransaction);
    assert.isDefined(sendResult);
    assert.isNotNull(sendResult);
    const hash = sendResult?.hash;
    console.log("tx hash:", hash);
    // wait commit to block, make sure indexer indexed this tx
    const txReceipt = await sendResult.wait(2);
    assert.isDefined(txReceipt);
    assert.isNotNull(txReceipt);
  });
});
