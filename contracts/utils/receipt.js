const { ethers } = require("hardhat");

async function getTxReceipt(txHash, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (receipt !== null) {
      return receipt;
    }
    await sleep(1000);
  }
  return null;
}

async function sleep(timeOut) {
  return new Promise(r => setTimeout(r, timeOut));
}

module.exports = {
  getTxReceipt
};
