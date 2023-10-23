require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
var ethers = require("ethers").ethers;

const INFURA_PROJECT_ID = "719d739434254b88ac95d53e2b6ac7";

const TEST_PK1 = process.env.PRIVATE_KEY ??
  // eth_address: 0x966b30e576a4d6731996748b48dd67c94ef29067
  "1390c30e5d5867ee7246619173b5922d3b04009cab9e9d91e14506231281a997";
const TEST_PK2 = process.env.PRIVATE_KEY2 ??
  // eth_address: 0x4fef21f1d42e0d23d72100aefe84d555781c31bb
  "2dc6374a2238e414e51874f514b0fa871f8ce0eb1e7ecaa0aed229312ffc91b0";
/**
 * TEST_PK3 should be an EOA containing some GWK.
 */
const TEST_PK3 = process.env.PRIVATE_KEY3 ??
  // eth_address: 0x0c1efcca2bcb65a532274f3ef24c044ef4ab6d73
  "dd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b";
const AXON_DEV_KEY =
  // eth_address: 0x8ab0CF264DF99D83525e9E11c7e4db01558AE1b1
  "0x383fcff8683b8115e31613949be24254b4204ffbe43c227408a76334a2e3fb32";

const PRIVATE_KEY0 = ethers.Wallet.createRandom().privateKey

const PRIVATE_KEY1 = ethers.Wallet.createRandom().privateKey

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    gw_devnet_v1: {
      url: `http://localhost:8024/instant-finality-hack`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`, `${PRIVATE_KEY0}`, `${PRIVATE_KEY1}`],
    },
    gw_testnet_v1: {
      url: `https://v1.testnet.godwoken.io/rpc/instant-finality-hack`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`, `0x${TEST_PK3}`, `${PRIVATE_KEY0}`, `${PRIVATE_KEY1}`],
      chainId: 71401,
    },
    gw_alphanet_v1: { // for internal testing
      url: `https://gw-alphanet-v1.godwoken.cf/instant-finality-hack`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`, `${PRIVATE_KEY0}`, `${PRIVATE_KEY1}`],
      chainId: 202206,
      gasPrice: 1,
    },
    gw_mainnet_v1: { // for regression testing on the Godwoken mainnet_v1
      url: `https://v1.mainnet.godwoken.io/rpc/instant-finality-hack`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`],
      chainId: 71402,
    },
    geth_devnet: {
      url: "http://localhost:8545",
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${TEST_PK1}`],
      // gas: 1_000_000_000_000_001, // Infura seems to cap it at 19981536.
      // gasPrice: 1
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${TEST_PK1}`]
    },
    axon_alphanet: {
      url: "https://rpc-alphanet-axon.ckbapp.dev/",
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`, AXON_DEV_KEY, `${PRIVATE_KEY0}`, `${PRIVATE_KEY1}`],
      chainId: 1098411886,
    },
    hardhat: {
      hardfork: "berlin",
      mining: {
        auto: true,
        interval: 1000
      }
    }
  },
  mocha: {
    timeout: 600000 // 10 minutes
  },
  solidity: {
    compilers: [
      {
        //for call code
        version: "0.4.24"
      },
      { // for polyjuice contracts
        version: "0.6.6",
        settings: {}
      },
      { version: "0.7.5" },
      { version: "0.8.6" }
    ], overrides: {}
  },
};
