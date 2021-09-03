const { expect } = require("chai");

async function main() {
  // const contractFact = await ethers.getContractFactory("RecursionContract");

  // console.log("call:", contractFact.interface.encodeFunctionData("sum", [64]));
  // const recurContract = await contractFact.deploy();
//   console.log("Token address:", token.address);

  const recurContract = await ethers.getContractAt("RecursionContract",
                  "0x852ea212fa775d0a73222d9c8bf72f099ca8033e");

  const txOverride = {
    gasPrice: 100,
    gasLimit: 1_000_000_000_000_002,
    nonce: 0
  };
  for (let i = 526; i < 1024; i++) {
    let pureSumLoop = await recurContract.pureSumLoop(i, txOverride);
    let sum = await recurContract.sum(i, txOverride);

    console.log("depth:", i);
    console.log("\t sum = ", parseInt(sum));
    expect(sum).to.equal(pureSumLoop);
    txOverride.nonce++;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });