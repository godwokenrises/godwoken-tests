const hardhat = require("hardhat")
const { assert } = require("chai")
const { RPC } = require("@ckb-lumos/toolkit")
const { ERC20_BYTECODE, ERC20_ABI } = require("../lib/sudtErc20Proxy")
const { isGwMainnetV1, isAxon } = require("../utils/network")

const { ethers } = hardhat;

describe("AutoCreateAccount", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  let rpc
  let owner
  let token
  before(async () => {
    const url = hardhat.network.config.url
    if (!url) {
      throw new Error("url not found")
    }
    rpc = new RPC(url);

    [owner] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory(ERC20_ABI, ERC20_BYTECODE, owner);
    token = await Contract.deploy("pckb", "pCKB", 10000, 1, 18)
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed to:", tokenAddress);
  })

  it("Auto create account if ckb balance > 0", async () => {
    const randomUser = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, ethers.provider);
    console.log("random user address:", randomUser.address)
    const randomUserBalance = await ethers.provider.getBalance(randomUser.address);
    console.log("random user balance:", randomUserBalance)
    const ownerBalance = await ethers.provider.getBalance(owner.address);
    console.log("owner balance:", ownerBalance);


    const randomUserId = await ethAddressToAccountId(randomUser.address, rpc);
    console.log("random user id:", randomUserId)
    assert.isUndefined(randomUserId)

    console.log(`timestamp before transfer:` + Date.now());
    const transferTx = await token.transfer(randomUser.address, (2000n * 10n ** 18n).toString());
    await transferTx.wait(2);
    console.log(`timestamp after transfer:` + Date.now());

    const ownerBalanceAfterTransfer = await ethers.provider.getBalance(owner.address);
    console.log("owner balance after transfer:", ownerBalanceAfterTransfer);
    const nextFromBalance = await ethers.provider.getBalance(randomUser.address)
    console.log("random user balance after transfer:", nextFromBalance)
    const randomUserIdAfterTransfer = await ethAddressToAccountId(randomUser.address, rpc)
    console.log("random user id after transfer:", randomUserIdAfterTransfer, typeof randomUserIdAfterTransfer)
    assert.strictEqual(typeof randomUserIdAfterTransfer, "bigint")
  });
});

function u32ToLE(num) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(num);
  return `0x${buf.toString("hex")}`;
}

async function ethAddressToAccountId(ethAddress, rpc) {
  if (ethAddress === "0x" || ethAddress === "0x" + "00".repeat(20)) {
    throw new Error("Eth address should not be empty or zero address");
  }

  if (!ethAddress.startsWith("0x") || ethAddress.length != 42) {
    throw new Error(`Eth address format error: ${ethAddress}`)
  }

  const ethRegistryAccountId = 2;
  const addressByteSize = 20;
  const registryAddress = "0x" + u32ToLE(ethRegistryAccountId).slice(2) + u32ToLE(addressByteSize).slice(2) + ethAddress.toLowerCase().slice(2)

  const scriptHash = await rpc.gw_get_script_hash_by_registry_address(registryAddress);
  if (scriptHash == null) {
    return undefined;
  }
  const accountId = await rpc.gw_get_account_id_by_script_hash(scriptHash);
  if (accountId == null) {
    return undefined;
  }
  return BigInt(accountId)
}
