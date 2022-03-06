"strict mode"

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SisyphusGamble", function () {
  it("Start a new sisyphus gamble -> gamble -> claimPrize", async () => {
    const [sender] = await ethers.getSigners();
    console.log(`sender's address: ${sender.address}`);

    console.log(`Deploying contract SisyphusGambleVenues`);
    const sisyphusGambleVenuesFact = await ethers.getContractFactory("SisyphusGambleVenues");
    const sisyphusGambleVenues = await sisyphusGambleVenuesFact.deploy();
    console.log(`  Sisyphus gamble venues deployed on address: ${sisyphusGambleVenues.address}`);

    console.log(`Deploying contract testERC20`);
    const erc20Fact = await ethers.getContractFactory("testERC20");
    const erc20 = await erc20Fact.deploy();
    console.log(`  TestERC20 on address: ${erc20.address}`);
    let balanceOfSender = await erc20.balanceOf(sender.address);
    console.log(`  sender's balnace = ${balanceOfSender}`);

    console.log("Start a new sisyphus gamble");
    await erc20.approve(sisyphusGambleVenues.address, 1);
    await sisyphusGambleVenues.newSisyphusGamble(erc20.address,
      1, // startingPrize
      1, // minGamble
      1, // weight
      2, // gamblingBlocks
    );
    expect(await erc20.balanceOf(sender.address)).to.equal(balanceOfSender - 1);
    console.log(`  Getting Sisyphus Gamble Venues...`);
    let gameList = await sisyphusGambleVenues.getSisyphusGambleVenues();
    // console.log(gameList);
    let sisyphusGambleAddress = gameList[0].sisyphusGamble;
    console.log(`  Sisyphus gamble venues deployed on address: ${sisyphusGambleAddress}`);

    console.log("SisyphusGambling...");
    let gambleContract = await ethers.getContractAt("SisyphusGamble", sisyphusGambleAddress);
    await erc20.approve(sisyphusGambleAddress, 3);
    await gambleContract.gamble(1);
    expect(await gambleContract.totalPrize()).eq(2);
    await gambleContract.gamble(1);
    expect(await gambleContract.totalPrize()).eq(3);
    await gambleContract.gamble(1);
    expect(await gambleContract.totalPrize()).eq(4);

    console.log("Claim Prize");
    balanceOfSender = await erc20.balanceOf(sender.address);
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
 * > npx hardhat test test/SisyhusGamble --network gw_devnet_v1
 */
