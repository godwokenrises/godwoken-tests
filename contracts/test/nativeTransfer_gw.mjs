import hardhat from "hardhat"
import chai from "chai"
import { isAxon, isGwMainnetV1 } from "../utils/network.js"
import { getTxReceipt } from "../utils/receipt.js";

const { ethers } = hardhat
const { expect } = chai

let gasPrice, gasPriceHex, faucetAccount, EOA0, EOA1, newEOA0, CA0

if (!(isGwMainnetV1() || isAxon())) {
  const gasPriceNumber = Number((await ethers.provider.getFeeData()).gasPrice)
  gasPrice = BigInt(Math.round(gasPriceNumber * 1.1))
  gasPriceHex = "0x" + gasPrice.toString(16)
  //external account0 and external account1 get a fixed balance
  const signers = await ethers.getSigners();
  faucetAccount = signers[0].address;
  EOA0 = signers[signers.length - 1].address; //last account address
  EOA1 = signers[signers.length - 2].address; //penultimate account address
  newEOA0 = ethers.Wallet.createRandom().address;
  //deploy contract,get contract account
  const baseFallbackReceive = await ethers.getContractFactory("baseFallbackReceive");
  const contract = await baseFallbackReceive.deploy();
  await contract.waitForDeployment();
  CA0 = await contract.getAddress(); //contract account address
}

describe("gw transfer success", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  const tests = [
    { name: "to EOA", from: EOA0, to: EOA1, value: "0x1", expectGasUsed: "21000" },
    { name: "to EOA tx.data is not null", from: EOA0, to: EOA1, value: "0x1", data: "0x12", expectGasUsed: "21016" },
    { name: "to itself", from: EOA0, to: EOA0, value: "0x10", expectGasUsed: "21000" },
    { name: "transfer 0", from: EOA0, to: EOA1, value: "0x0", expectGasUsed: "21000" },
    { name: "to new EOA", from: EOA0, to: newEOA0, value: "0x100", expectGasUsed: "46000" },
    { name: "to CA", from: EOA0, to: CA0, value: "0x200", expectGasUsed: "21033" },
    { name: "to CA tx.data is not null", from: EOA0, to: CA0, data: "0x12", value: "0x300", expectGasUsed: "21050" },
  ]

  before(async function () {
    this.timeout(15000);
    await transfer(faucetAccount, EOA0, "0x" + (BigInt("460000") * gasPrice).toString(16));
    await transfer(faucetAccount, EOA1, "0x" + BigInt("1").toString(16));
  });

  for (let i = 0; i < tests.length; i++) {
    let test = tests[i]
    it(test.name, async () => {
      const from_balance = await ethers.provider.getBalance(test.from)
      const to_balance = await ethers.provider.getBalance(test.to)
      console.log(`before transfer from_balance(${test.from}):${from_balance} to_balance(${test.to}):${to_balance}`)
      const estimatedGas = await estGas(test.from, test.to, test.value, test.data)
      const response = await transfer(test.from, test.to, test.value, test.data)
      const from_balance_sent = await ethers.provider.getBalance(test.from)
      const to_balance_sent = await ethers.provider.getBalance(test.to)
      console.log(`after transfer from_balance(${test.from}):${from_balance_sent} to_balance(${test.to}):${to_balance_sent} gasPrice:${parseInt(gasPrice, 16)} fee:${response.gasUsed * gasPrice} estimatedGas:${parseInt(estimatedGas, 16)}`)
      expect(response.gasUsed).to.be.equal(test.expectGasUsed)
      expect(estimatedGas).to.be.least(response.gasUsed)
      if (test.from === test.to) {
        //from_balance-from_balance_sent=gasUsed*gasPrice
        expect(from_balance - from_balance_sent).to.be.equal(response.gasUsed * gasPrice)
      } else {
        //from_balance-from_balance_sent=value+gasUsed*gasPrice
        //to_balance_sent-to_balance=value
        expect(from_balance - from_balance_sent).to.be.equal(BigInt(test.value) + response.gasUsed * gasPrice)
        expect(to_balance_sent - to_balance).to.be.equal(BigInt(test.value))
      }
    }).timeout(20000)
  }
})

describe("gw transfer failed", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  const from = EOA1
  let to = EOA0

  before(async function () {
    this.timeout(10000);
    await transfer(faucetAccount, EOA1, "0x" + (BigInt("230000") * gasPrice).toString(16));
  });

  it("gasLimit not enough", async () => {
    const from_balance = await ethers.provider.getBalance(from)
    const to_balance = await ethers.provider.getBalance(to)
    console.log(`before transfer from_balance(${from}):${from_balance} to_balance(${to}):${to_balance}`)
    try {
      await ethers.provider.send("eth_sendTransaction", [{
        "from": from,
        "to": to,
        "gas": "0x100",
        "gasPrice": gasPriceHex,
        "value": "0x1"
      }])
    } catch (e) {
      expect(e.toString()).to.be.contains("intrinsic Gas too low")
    } finally {
      const from_balance_sent = await ethers.provider.getBalance(from)
      const to_balance_sent = await ethers.provider.getBalance(to)
      console.log(`after transfer from_balance(${from}):${from_balance_sent} to_balance(${to}):${to_balance_sent}`)
      expect(from_balance).to.be.equal(from_balance_sent)
      expect(to_balance).to.be.equal(to_balance_sent)
    }
  }).timeout(15000)

  it("should fail when transferring to an unregistered account with gasLimit less than 46000", async () => {
    to = ethers.Wallet.createRandom().address;
    const from_balance = await ethers.provider.getBalance(from)
    const to_balance = await ethers.provider.getBalance(to)
    console.log(`before transfer from_balance(${from}): ${from_balance}`)
    console.log(`before transfer to_balance(${to}): ${to_balance}`)

    try {
      await ethers.provider.send("eth_call", [{
        "from": from,
        "to": to,
        // gasLimit not enough but enough for 21000
        "gas": "0xb3af", // 21000 < 0xb3af = 45999 < 46000
        "value": "0x1"
      }, "latest"])
    } catch (err) {
      // Why does the error only say "ProviderError: unknown error"?
      // https://github.com/godwokenrises/godwoken/pull/1013 reverted the extra error info,
      // so we can't get the detailed error info:
      //
      // ```js
      // errorInsufficientGasLimit: {
      //     code: -93,
      //     type: "ERROR_INSUFFICIENT_GAS_LIMIT",
      //     message: "error insufficient gas limit",
      // }
      // ```
      //
      // see: https://github.com/godwokenrises/godwoken/blob/v1.14.0/web3/packages/api-server/src/methods/exit-code.ts
      console.log("errorInsufficientGasLimit", err);
    }

    const w = await ethers.getSigner(EOA1)
    const res = await w.sendTransaction({
      "to": to,
      // intrinsic Gas too low
      "gasLimit": "0xb3af", // 21000 < 0xb3af = 45999 < 46000
      "value": "0x1",
    })
    console.log(`The transfer (${res.hash}) should be failed.`)

    let receipt = null
    while (receipt === null) {
      console.log("Transaction is still pending")
      receipt = await ethers.provider.getTransactionReceipt(res.hash)
    }
    expect(receipt.status).equals(0)
  }).timeout(15000)

  it("balance not enough", async () => {
    const from_balance = await ethers.provider.getBalance(from)
    const to_balance = await ethers.provider.getBalance(to)
    console.log(`before transfer from_balance(${from}): ${from_balance}`)
    console.log(`before transfer to_balance(${to}): ${to_balance}`)
    try {
      await transfer(from, to, "0x845951614014880000000")
    } catch (e) {
      expect(e.toString()).to.be.contains("insufficient balance")
    } finally {
      const from_balance_sent = await ethers.provider.getBalance(from)
      const to_balance_sent = await ethers.provider.getBalance(to)
      console.log(`after transfer from_balance(${from}):${from_balance_sent} to_balance(${to}):${to_balance_sent}`)
      expect(from_balance).to.be.equal(from_balance_sent)
      expect(to_balance).to.be.equal(to_balance_sent)
    }
  }).timeout(15000)

  it("repeated nonce", async () => {
    const txHash = await ethers.provider.send("eth_sendTransaction", [{
      "from": from,
      "to": to,
      "gas": "0xb3b0",
      "gasPrice": gasPriceHex,
      "value": "0x1"
    }])
    const txInfo = await ethers.provider.getTransaction(txHash)
    await getTxReceipt(txHash)
    const nonce = await ethers.provider.getTransactionCount(txInfo.from)
    const from_balance = await ethers.provider.getBalance(from)
    const to_balance = await ethers.provider.getBalance(to)
    console.log(`before transfer from_balance(${from}):${from_balance} to_balance(${to}):${to_balance}`)
    try {
      await (await ethers.getSigners())[0].sendTransaction({
        "to": to,
        "value": "0x1",
        "nonce": nonce - 1
      })
    } catch (e) {
      expect(e.toString()).to.be.contains("invalid nonce")
    } finally {
      const from_balance_sent = await ethers.provider.getBalance(from)
      const to_balance_sent = await ethers.provider.getBalance(to)
      console.log(`after transfer from_balance(${from}):${from_balance_sent} to_balance(${to}):${to_balance_sent}`)
      expect(from_balance).to.be.equal(from_balance_sent)
      expect(to_balance).to.be.equal(to_balance_sent)
    }
  }).timeout(15000)
})


async function transfer(from, to, value, data) {
  let tx = await ethers.provider.send("eth_sendTransaction", [{
    from,
    to,
    "gas": "0xb3b0", // 46000
    "gasPrice": gasPriceHex,
    "value": value,
    "data": data
  }])
  let response = await getTxReceipt(tx)
  expect(response.status).to.be.equal(1)
  return response
}

async function estGas(from, to, value, data) {
  return await ethers.provider.send("eth_estimateGas", [{
    from,
    to,
    "gas": "0xb3b0",
    "gasPrice": gasPriceHex,
    "value": value,
    "data": data
  }])
}

/**
 * How to run this test?
 * > npx hardhat test test/nativeTransfer_gw.mjs --network gw_testnet_v1
 */
