"strict mode"

const util = require('util');
const { ethers } = require("hardhat");

const SUDT_ID = 1; // Replace this with SUDT ID received from depositing SUDT to Layer 2. This should be a number.
const SUDT_NAME = 'ckETH';
const SUDT_SYMBOL = 'ckETH';
const SUDT_DECIMALS = 18;
const SUDT_TOTAL_SUPPLY = 9999999999;

const SENDER_PRIVKEY = '0x178f462b829fca3d029803e93af120164b953e65c0c1895cb6802fe62c310b2a';
const RECEIVER_ADDR = '0x2f1725d16a207824868a80aa9e196b4e82fe0d2a';

async function main() {
	console.log('Deploy ERC20 contract first');
	// https://github.com/nervosnetwork/godwoken-polyjuice/blob/compatibility-breaking-changes/solidity/erc20/SudtERC20Proxy_UserDefinedDecimals.sol
	const erc20Fact = await ethers.getContractFactory("contracts/SudtERC20Proxy_UserDefinedDecimals.sol:ERC20");
	const erc20 = await erc20Fact.deploy(SUDT_NAME, SUDT_SYMBOL, SUDT_TOTAL_SUPPLY, SUDT_ID, SUDT_DECIMALS);
	// const erc20Fact = await ethers.getContractFactory("testERC20");
	// const erc20 = await erc20Fact.deploy();
	console.log(`  ERC20 on address: ${erc20.address}`);

	let signer = new ethers.Wallet(SENDER_PRIVKEY, ethers.provider);
	const erc20_rw = erc20.connect(signer);
	let from_balance = await erc20_rw.callStatic.balanceOf(signer.getAddress());
	let to_balance = await erc20_rw.callStatic.balanceOf(RECEIVER_ADDR);
	console.log(`from balance: ${from_balance}, to balance: ${to_balance}`);
	let amount = 1000;
	let tx = await erc20_rw.transfer(RECEIVER_ADDR, amount);
	console.log(` transfer: ${util.inspect(tx)}`);
	await tx.wait();
}

// npx hardhat run scripts/erc20_transfer.js --network gw_devnet_v1
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});