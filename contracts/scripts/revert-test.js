const { expect } = require("chai");

(async () => {
  const contractFact = await ethers.getContractFactory("ErrorHandling");
  const contract = await contractFact.deploy();

  contract.getRevertMsg(444);
  contract.getRevertMsg(555);
  contract.getRevertMsg(666);
})();
