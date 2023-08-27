const { ethers } = require("hardhat");
const { expect } = require("chai");
const { getTxReceipt } = require("../utils/receipt");

describe("bn256", function () {
  this.timeout(300000);
  let contract;

  before(async function () {
    const Bn256 = await ethers.getContractFactory("Bn256");
    contract = await Bn256.deploy();
    await contract.waitForDeployment();
  });

  it("0x06 legal input", async () => {
    const tx = await contract.getFunction("callBn256Add").send(numberToBytes32("0x01"), numberToBytes32("0x02"), numberToBytes32("0x01"), numberToBytes32("0x02"));
    const receipt = await tx.wait();
    expect(receipt.status).to.be.equal(1);
  })

  it("0x06 illegal input", async () => {
    const signers = await ethers.getSigners();
    const from = signers[0].address;
    const to = contract.address;
    const gas = "0x186a0";
    const gasPrice = "0x" + (await ethers.provider.getFeeData()).gasPrice.toString(16);
    const data = "0x4849f2790000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"
    // const from_balance = await ethers.provider.getBalance(from)
    // console.log(`before tx from_balance(${from.substring(0, 6)}):${from_balance}`)
    const tx = await ethers.provider.send("eth_sendTransaction", [{
      from,
      to,
      "gas": gas,
      "gasPrice": gasPrice,
      "data": data
    }])
    const receipt = await getTxReceipt(tx)
    // receipt.status: 1 (success) or 0 (failure)
    expect(receipt.status).to.be.equal(0);
    expect(receipt.gasUsed > 0).to.be.true
    // const from_balance_sent = await ethers.provider.getBalance(from)
    // console.log(`before tx from_balance(${from.substring(0, 6)}):${from_balance_sent}`)
    // expect(from_balance.sub(from_balance_sent)).to.be.equal(receipt.gasUsed.mul(gasPrice))
  })
});

async function numberToBytes32(amount) {
  return ethers.zeroPadValue(ethers.hexlify(amount), 32)
}
