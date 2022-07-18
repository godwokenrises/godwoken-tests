const { network } = require("hardhat");

const Networks = {
  GwDevnet_v1: 'gw_devnet_v1',
  GwTestnet_v1: 'gw_testnet_v1',
  GwAlphanet_v1: 'gw_alphanet_v1',
  GwMainnet_v1: 'gw_mainnet_v1',
  Rinkeby: 'rinkeby',
  Mainnet: 'mainnet',
  Kovan: 'kovan',
  Hardhat: 'hardhat',
};

function isNetwork(name) {
  return network.name === name;
}

function isGwMainnetV1() {
  return isNetwork(Networks.GwMainnet_v1);
}

module.exports = {
  Networks,
  isNetwork,
  isGwMainnetV1,
};
