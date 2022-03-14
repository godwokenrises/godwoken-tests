const { expect } = require("chai");

  describe("Calc contract", function () {
    it("Deployment computing contract", async function () {
      const [owner] = await ethers.getSigners();
  
      const Calc = await ethers.getContractFactory("Calc");
  
      const hardhatCalc = await Calc.deploy();
  
      const addBalance = await hardhatCalc.add(5,6);
      const sumBalance = await hardhatCalc.sub(5,6);
    });
  });