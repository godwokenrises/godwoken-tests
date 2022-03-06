const { expect } = require("chai");

(async () => {
  const contractFact = await ethers.getContractFactory("ErrorHandling");
  const contract = await contractFact.deploy();

  contract.getRevertMsg(666);

  contract.getRevertMsg(444);
  contract.getRevertMsg(555);
})();

// npx hardhat run scripts/revert-test.js --network gw_devnet_v1