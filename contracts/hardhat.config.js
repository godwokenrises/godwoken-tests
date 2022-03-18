require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

const INFURA_PROJECT_ID = "719d739434254b88ac95d53e2b6ac997";
// eth_address: 0x966b30e576a4d6731996748b48dd67c94ef29067
const PRIVATE_KEY = "1390c30e5d5867ee7246619173b5922d3b04009cab9e9d91e14506231281a997";
// eth_address: 0x4fef21f1d42e0d23d72100aefe84d555781c31bb
const PRIVATE_KEY2 = "2dc6374a2238e414e51874f514b0fa871f8ce0eb1e7ecaa0aed229312ffc91b0"

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    gw_devnet_v1: {
      url: `http://localhost:8024`,
      accounts: [`0x${PRIVATE_KEY}`, `0x${PRIVATE_KEY2}`],
    },
    gw_testnet_v1: {
      url: `https://godwoken-testnet-web3-v1-rpc.ckbapp.dev`,
      accounts: [`0x${PRIVATE_KEY}`, `0x${PRIVATE_KEY2}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
      // gas: 1_000_000_000_000_001, // Infura seems to cap it at 19981536.
      // gasPrice: 1
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    // hardhat: {
    //   gas: 1000000000000, // Infura seems to cap it at 19981536.
    //   gasPrice: 1
    // }
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
