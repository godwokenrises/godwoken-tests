require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

const INFURA_PROJECT_ID = "719d739434254b88ac95d53e2b6ac997";
// eth_address: 0xe16b3481c0a69e948a612c77a8d64ec36f1d57f8
const PRIVATE_KEY = "1390c30e5d5867ee7246619173b5922d3b04009cab9e9d91e14506231281a997";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    gw_devnet_v1: {
      url: `http://localhost:8024`,
      accounts: [`0x6cd5e7be2f6504aa5ae7c0c04178d8f47b7cfc63b71d95d9e6282f5b090431bf`, `0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b`],
    },
    gw_testnet_v1: {
      url: `https://godwoken-testnet-web3-v1-rpc.ckbapp.dev`,
      accounts: [`0x${PRIVATE_KEY}`],
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
