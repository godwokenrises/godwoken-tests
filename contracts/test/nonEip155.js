const { assert } = require("chai");
const hardhat = require("hardhat");
const rlp = require("rlp");
const { key } = require("@ckb-lumos/hd");
const hardhatConfig = require("../hardhat.config");
const { isAxon } = require("../utils/network");
const { getTxReceipt } = require("../utils/receipt");

const { ethers } = hardhat;

// non-EIP-155 transactions are mainly to support EIP-1820. Many projects use
// this method to support multi-chain contracts using the same address.
//
// EIP-155: The currently existing signature scheme using v = 27 and v = 28
// remains valid and continues to operate under the same rules as it did
// previously.
describe("Non eip155 tx", function () {
  it("Send non eip155 tx", async function () {
    const [owner] = await ethers.getSigners();

    const ConsoleContract = await ethers.getContractFactory("Storage");
    const txRequest = await ConsoleContract.getDeployTransaction();

    // non-eip155 tx
    // (nonce, gasprice, startgas, to, value, data)
    const nonce = await ethers.provider.getTransactionCount(owner.address);
    const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
    const gasLimit = await owner.estimateGas(txRequest);
    const to = "0x";
    const value = 0;
    const data = txRequest.data?.toString();

    const rlpData = [
      nonce,
      gasPrice,
      gasLimit,
      to,
      value,
      data,
    ];
    const rlpEncoded = rlp.encode(rlpData);

    const message = ethers.keccak256(Buffer.from(rlpEncoded)).toString("hex");
    const ownerPrivateKey =
      hardhatConfig.networks?.[hardhat.network.name]?.accounts[0];
    const signature = key.signRecoverable(message, ownerPrivateKey);

    const r = "0x" + signature.slice(2, 66);
    const s = "0x" + signature.slice(66, 130);
    const v = +("0x" + signature.slice(130, 132));
    assert(v === 0 || v === 1);

    const rawTransactionData = [
      nonce,
      gasPrice,
      gasLimit,
      to,
      value,
      data,
      v + 27,
      BigInt(r),
      BigInt(s),
    ];

    const rawTransaction = "0x" + Buffer.from(rlp.encode(rawTransactionData)).toString("hex");
    const txHash = await ethers.provider.send('eth_sendRawTransaction', [rawTransaction]);
    console.log("tx hash:", txHash);
    // wait commit to block, make sure indexer indexed this tx
    const txReceipt = await getTxReceipt(txHash);
    assert.isDefined(txReceipt);
    assert.isNotNull(txReceipt);
  });
});