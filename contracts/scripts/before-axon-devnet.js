const { ethers } = require("hardhat");

/*
 * Deposit for test accounts before running tests.
 */
async function main() {
  const MIN_BALANCE = 100_000_000_000;
  const signers = await ethers.getSigners();

  // Query the balance of every test account
  let [b1, b2, _bg, b3, b4] = signers.map(async account => {
    const balance = await account.getBalance();
    console.log(`native token balance of ${account.address}: ${balance.toString()}`);
    return balance;
  });

  const [a1, a2, genesis, a3, a4] = signers;
  if (await b1 < MIN_BALANCE) {
    await genesis.sendTransaction({ to: a1.address, value: MIN_BALANCE });
  }
  if (await b2 < MIN_BALANCE) {
    await genesis.sendTransaction({ to: a2.address, value: MIN_BALANCE });
  }
  if (await b3 < MIN_BALANCE) {
    await genesis.sendTransaction({ to: a3.address, value: MIN_BALANCE });
  }
  if (await b4 < MIN_BALANCE) {
    await genesis.sendTransaction({ to: a4.address, value: MIN_BALANCE });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * How to run this?
 * > npx hardhat run scripts/before-axon-devnet.js --network axon_alphanet
 */
