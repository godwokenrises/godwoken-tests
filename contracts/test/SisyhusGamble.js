"strict mode"

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1 } = require('../utils/network');

describe("SisyphusGamble", function () {
  if (isGwMainnetV1()) {
    return;
  }

  it("Start a new sisyphus gamble -> gamble -> claimPrize", async () => {
    const [sender] = await ethers.getSigners();
    console.log(`sender's address: ${sender.address}`);

    console.log(`Deploying contract SisyphusGambleVenues`);
    const sisyphusGambleVenuesFact = await ethers.getContractFactory("SisyphusGambleVenues");
    const sisyphusGambleVenues = await sisyphusGambleVenuesFact.deploy();
    await sisyphusGambleVenues.waitForDeployment();
    const sisyphusGambleVenuesAddress = await sisyphusGambleVenues.getAddress();
    console.log(`  Sisyphus gamble venues deployed on address: ${sisyphusGambleVenuesAddress}`);

    console.log(`Deploying contract testERC20`);
    const erc20Fact = await ethers.getContractFactory("testERC20");
    const erc20 = await erc20Fact.deploy();
    console.log(`  TestERC20 Deployment Transaction Hash: ${erc20.deploymentTransaction().hash}`);
    await erc20.waitForDeployment();
    const erc20Address = await erc20.getAddress()
    console.log(`  TestERC20 on address: ${erc20Address}`);

    let balanceOfSender = await erc20.getFunction("balanceOf").staticCall(sender.address);
    console.log(`  sender's balnace = ${balanceOfSender}`);
    expect(balanceOfSender).equals(10000);

    console.log("Start a new sisyphus gamble");
    const tx = await erc20.getFunction("approve").send(sisyphusGambleVenuesAddress, 1);
    await tx.wait();
    const tx1 = await sisyphusGambleVenues.getFunction("newSisyphusGamble").send(erc20Address,
      1, // startingPrize
      1, // minGamble
      1, // weight
      7, // gamblingBlocks, set longer for with/without instant-finality hack
    );
    await tx1.wait();
    expect(await erc20.getFunction("balanceOf").staticCall(sender.address)).to.equal(balanceOfSender - 1n);
    console.log(`  Getting Sisyphus Gamble Venues...`);
    let gameList = await sisyphusGambleVenues.getFunction("getSisyphusGambleVenues").staticCall();
    console.log("gameList:", gameList);
    let sisyphusGambleAddress = gameList[0].sisyphusGamble;
    console.log(`  Sisyphus gamble venues deployed on address: ${sisyphusGambleAddress}`);

    console.log("SisyphusGambling...");
    let gambleContract = await ethers.getContractAt("SisyphusGamble", sisyphusGambleAddress);
    const tx2 = await erc20.getFunction("approve").send(sisyphusGambleAddress, 3);
    await tx2.wait();
    const tx3 = await gambleContract.getFunction("gamble").send(1);
    await tx3.wait();

    expect(await gambleContract.getFunction("totalPrize").staticCall()).eq(2);
    const tx4 = await gambleContract.getFunction("gamble").send(1);
    await tx4.wait();
    expect(await gambleContract.getFunction("totalPrize").staticCall()).eq(3);
    const tx5 = await gambleContract.getFunction("gamble").send(1);
    await tx5.wait();
    expect(await gambleContract.getFunction("totalPrize").staticCall()).eq(4);

    console.log(">> Claim Prize");
    balanceOfSender = await erc20.getFunction("balanceOf").staticCall(sender.address);
    console.log(`  sender's balnace = ${balanceOfSender}`);

    return;
    // FIXME: ProviderError: Method not found
    await ethers.provider.send('evm_mine'); // jump to next block
    await gambleContract.claimPrize();
    expect(await erc20.balanceOf(sender.address)).eq(Number(balanceOfSender) + 4);
  });
});


/**
 * How to run this?
 * > npx hardhat test test/SisyhusGamble --network gw_testnet_v1
 */
