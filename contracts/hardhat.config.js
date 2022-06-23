require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

const INFURA_PROJECT_ID = "719d739434254b88ac95d53e2b6ac997";

// eth_address: 0x966b30e576a4d6731996748b48dd67c94ef29067
const TEST_PK1 = process.env.PRIVATE_KEY ?? "1390c30e5d5867ee7246619173b5922d3b04009cab9e9d91e14506231281a997";

// eth_address: 0x4fef21f1d42e0d23d72100aefe84d555781c31bb
const TEST_PK2 = process.env.PRIVATE_KEY2 ?? "2dc6374a2238e414e51874f514b0fa871f8ce0eb1e7ecaa0aed229312ffc91b0";

// The issuer of GWK, eth_address: 0x8291507afda0bba820efb6dfa339f09c9465215c
const TEST_PK3 = process.env.PRIVATE_KEY3;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    gw_devnet_v1: {
      url: `http://localhost:8024`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`],
    },
    gw_testnet_v1: {
      url: `https://godwoken-testnet-v1.ckbapp.dev`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`, `0x${TEST_PK3}`],
      version: "1.2.0",
      chainId: 71401,
    },
    // TODO: It is the same as gw_testnet_v1 and this name will be deprecated.
    gw_betanet_v1: {
      url: `https://godwoken-betanet-v1.ckbapp.dev`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`],
      version: "1.2.0",
      chainId: 71401,
    },
    gw_alphanet_v1: { // for internal testing
      url: `https://godwoken-alphanet-v1.ckbapp.dev`,
      accounts: [`0x${TEST_PK1}`, `0x${TEST_PK2}`],
      version: "1.2.0",
      chainId: 202206,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${TEST_PK1}`],
      // gas: 1_000_000_000_000_001, // Infura seems to cap it at 19981536.
      // gasPrice: 1
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${TEST_PK1}`]
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${TEST_PK1}`]
    },
    hardhat: {
      hardfork: "berlin"
    }
  },
  mocha: {
    timeout: 1800000 // 30 minutes
  },
  solidity: {
    compilers: [
      { // for polyjuice contracts
        version: "0.6.6",
        settings: {}
      }, 
      { version: "0.7.5" },
      { version: "0.8.6" }
    ], overrides: {}
  },
};
