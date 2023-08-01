const {network} = require("hardhat");

const Networks = {
    GwDevnet_v1: 'gw_devnet_v1',
    GwTestnet_v1: 'gw_testnet_v1',
    GwAlphanet_v1: 'gw_alphanet_v1',
    GwMainnet_v1: 'gw_mainnet_v1',
    Rinkeby: 'rinkeby',
    Mainnet: 'mainnet',
    Kovan: 'kovan',
    AxonDevnet: 'axon_devnet_20230725',
    AxonAlphanet: 'axon_alphanet',
    Hardhat: 'hardhat',
};

function isNetwork(name) {
    return network.name === name;
}

function isGwMainnetV1() {
    return isNetwork(Networks.GwMainnet_v1);
}

function isHardhatNetwork() {
    return isNetwork(Networks.Hardhat);
}

function isAxon() {
    return isNetwork(Networks.AxonDevnet) || isNetwork(Networks.AxonAlphanet);
}

function isGw() {
    return isNetwork(Networks.GwDevnet_v1) || isNetwork(Networks.GwTestnet_v1) || isNetwork(Networks.GwAlphanet_v1) || isNetwork(Networks.GwMainnet_v1);
}

module.exports = {
    Networks,
    isNetwork,
    isGwMainnetV1,
    isHardhatNetwork,
    isAxon,
    isGw
};
