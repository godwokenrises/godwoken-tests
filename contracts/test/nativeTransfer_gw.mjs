import hardhat from "hardhat"
import chai from "chai"
import {isAxon, isGwMainnetV1} from "../utils/network.js"

const {ethers} = hardhat
const {expect} = chai
const {BigNumber} = ethers

let gasPrice, faucetAccount, EOA0, EOA1, newEOA0, CA0

if (!(isGwMainnetV1() || isAxon())) {
  gasPrice = await getGasPrice(ethers.provider);
  //external account0 and external account1 get a fixed balance
  const signers = await ethers.getSigners();
  faucetAccount = signers[0].address;
  EOA0 = signers[signers.length - 1].address; //last account address
  EOA1 = signers[signers.length - 2].address; //penultimate account address
  newEOA0 = ethers.Wallet.createRandom().address;
  //deploy contract,get contract account
  const baseFallbackReceive = await ethers.getContractFactory("baseFallbackReceive");
  const contract = await baseFallbackReceive.deploy();
  await contract.deployed();
  CA0 = contract.address; //contract account address
}

describe("gw transfer success", function () {
  if (isGwMainnetV1() || isAxon()) {
    return;
  }

  const tests = [
    {name: "to EOA", from: EOA0, to: EOA1, value: "0x1", expectGasUsed: "21000"},
    {name: "to EOA tx.data is not null", from: EOA0, to: EOA1, value: "0x1", data: "0x12", expectGasUsed: "21016"},
    {name: "to itself", from: EOA0, to: EOA0, value: "0x10", expectGasUsed: "21000"},
    {name: "transfer 0", from: EOA0, to: EOA1, value: "0x0", expectGasUsed: "21000"},
    {name: "to new EOA", from: EOA0, to: newEOA0, value: "0x100", expectGasUsed: "46000"},
    {name: "to CA", from: EOA0, to: CA0, value: "0x200", expectGasUsed: "21033"},
    {name: "to CA tx.data is not null", from: EOA0, to: CA0, data: "0x12", value: "0x300", expectGasUsed: "21050"},
  ]

  before(async function () {
    this.timeout(15000);
    await transfer(faucetAccount, EOA0, BigNumber.from("460000").mul(gasPrice).toHexString().replaceAll("0x0", "0x"));
    await transfer(faucetAccount, EOA1, BigNumber.from("1").toHexString().replaceAll("0x0", "0x"));
  });

  for (let i = 0; i < tests.length; i++) {
    let test = tests[i]
    it(test.name, async () => {
      const from_balance = await ethers.provider.getBalance(test.from)
      const to_balance = await ethers.provider.getBalance(test.to)
      console.log(`before transfer from_balance(${test.from.substring(0, 6)}):${from_balance} to_balance(${test.to.substring(0, 6)}):${to_balance}`)
      const estimatedGas = await estGas(test.from, test.to, test.value, test.data)
      const response = await transfer(test.from, test.to, test.value, test.data)
      const from_balance_sent = await ethers.provider.getBalance(test.from)
      const to_balance_sent = await ethers.provider.getBalance(test.to)
      console.log(`after transfer from_balance(${test.from.substring(0, 6)}):${from_balance_sent} to_balance(${test.to.substring(0, 6)}):${to_balance_sent} gasPrice:${parseInt(gasPrice, 16)} fee:${response.gasUsed.mul(gasPrice).toString()} estimatedGas:${parseInt(estimatedGas, 16)}`)
      expect(response.gasUsed).to.be.equal(test.expectGasUsed)
      expect(estimatedGas).to.be.least(response.gasUsed)
      if (test.from === test.to) {
        //from_balance-from_balance_sent=gasUsed*gasPrice
        expect(from_balance.sub(from_balance_sent)).to.be.equal(response.gasUsed.mul(gasPrice))
      } else {
        //from_balance-from_balance_sent=value+gasUsed*gasPrice
        //to_balance_sent-to_balance=value
        expect(from_balance.sub(from_balance_sent)).to.be.equal(BigNumber.from(test.value).add(response.gasUsed.mul(gasPrice)))
        expect(to_balance_sent.sub(to_balance)).to.be.equal(BigNumber.from(test.value))
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
    await transfer(faucetAccount, EOA1, BigNumber.from("230000").mul(gasPrice).toHexString().replaceAll("0x0", "0x"));
  });

  it("gasLimit not enough", async () => {
    const from_balance = await ethers.provider.getBalance(from)
    const to_balance = await ethers.provider.getBalance(to)
    console.log(`before transfer from_balance(${from.substring(0, 6)}):${from_balance} to_balance(${to.substring(0, 6)}):${to_balance}`)
    try {
      await ethers.provider.send("eth_sendTransaction", [{
        "from": from,
        "to": to,
        "gas": "0x100",
        "gasPrice": gasPrice,
        "value": "0x1"
      }])
    } catch (e) {
      expect(e.toString()).to.be.contains("intrinsic Gas too low")
    } finally {
      const from_balance_sent = await ethers.provider.getBalance(from)
      const to_balance_sent = await ethers.provider.getBalance(to)
      console.log(`after transfer from_balance(${from.substring(0, 6)}):${from_balance_sent} to_balance(${to.substring(0, 6)}):${to_balance_sent}`)
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
      // "gasPrice": gasPrice,
      "value": "0x1",
    })
    console.log(`The transfer (${res.hash}) should be failed.`)

    let receipt = null
    while (receipt === null) {
      console.log("Transaction is still pending")
      receipt = await ethers.provider.getTransactionReceipt(res.hash)
      await sleep(2000)
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
      console.log(`after transfer from_balance(${from.substring(0, 6)}):${from_balance_sent} to_balance(${to.substring(0, 6)}):${to_balance_sent}`)
      expect(from_balance).to.be.equal(from_balance_sent)
      expect(to_balance).to.be.equal(to_balance_sent)
    }
  }).timeout(15000)

  it("repeated nonce", async () => {
    const txHash = await ethers.provider.send("eth_sendTransaction", [{
      "from": from,
      "to": to,
      "gas": "0xb3b0",
      "gasPrice": gasPrice,
      "value": "0x1"
    }])
    const txInfo = await ethers.provider.getTransaction(txHash)
    const nonce = await ethers.provider.getTransactionCount(txInfo.from)
    await getTxReceipt(ethers.provider, txHash, 100)
    const from_balance = await ethers.provider.getBalance(from)
    const to_balance = await ethers.provider.getBalance(to)
    console.log(`before transfer from_balance(${from.substring(0, 6)}):${from_balance} to_balance(${to.substring(0, 6)}):${to_balance}`)
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
      console.log(`after transfer from_balance(${from.substring(0, 6)}):${from_balance_sent} to_balance(${to.substring(0, 6)}):${to_balance_sent}`)
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
    "gasPrice": gasPrice,
    "value": value,
    "data": data
  }])
  let response = await getTxReceipt(ethers.provider, tx, 100)
  expect(response.status).to.be.equal(1)
  return response
}

async function estGas(from, to, value, data) {
  return await ethers.provider.send("eth_estimateGas", [{
    from,
    to,
    "gas": "0xb3b0",
    "gasPrice": gasPrice,
    "value": value,
    "data": data
  }])
}

async function getTxReceipt(provider, txHash, count) {
  let response
  for (let i = 0; i < count; i++) {
    response = await provider.getTransactionReceipt(txHash);
    if (response == null) {
      await sleep(2000)
      continue;
    }
    if (response.confirmations >= 1) {
      return response
    }
    await sleep(2000)
  }
  return response
}

async function getGasPrice(provider) {
  let gasPrice = await provider.getGasPrice();
  return gasPrice.toHexString().replaceAll("0x0", "0x");
}

async function sleep(timeOut) {
  await new Promise(r => setTimeout(r, timeOut));
}

/**
 * How to run this test?
 * > npx hardhat test test/nativeTransfer_gw.mjs --network gw_testnet_v1
 */
