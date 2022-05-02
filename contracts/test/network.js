const hardhat = require("hardhat");
const assert = require("assert");

describe("Check the Godwoken network version", function () {
  const { network } = hardhat;
  console.log(network.config);

  it("should have a config field", function () {
    assert.notEqual(hardhat.config, undefined);
  });
});
