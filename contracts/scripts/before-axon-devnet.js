const hardhat = require("hardhat");
/*
    * Deposit test accounts before running test.
*/
async function main() {
    const MIN_BALANCE = 100_000_000_000;
    const ethers = hardhat.ethers;
    const [a1, a2, a3, a4, genesis] = await ethers.getSigners();
    if (await a1.getBalance() < MIN_BALANCE) {
        await genesis.sendTransaction({to: a1.address, value: MIN_BALANCE})
    }
    if (await a2.getBalance() < MIN_BALANCE) {
        await genesis.sendTransaction({to: a2.address, value: MIN_BALANCE})
    }
    if (await a3.getBalance() < MIN_BALANCE) {
        await genesis.sendTransaction({to: a3.address, value: MIN_BALANCE})
    }
    if (await a4.getBalance() < MIN_BALANCE) {
        await genesis.sendTransaction({to: a4.address, value: MIN_BALANCE})
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
 * > npx hardhat run scripts/before-axon-devnet.js --network axon_devnet
 */
