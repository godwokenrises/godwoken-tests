require("@nomiclabs/hardhat-waffle");

const INFURA_PROJECT_ID = "719d739434254b88ac95d53e2b6ac997";
const PRIVATE_KEY = "9f411d8059c607af690181f1008851790bd46e446b6167196862bc5a6e1784c2";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
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
