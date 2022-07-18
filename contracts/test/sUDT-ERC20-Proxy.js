/**
 * On testnet, one developer could deploy their own sUDT_ERC20_Proxy contract;
 * while on mainnet, sUDT_ERC20_Proxy should only be deployed by the core team.
 * 
 * What is a sUDT-ERC20 Proxy Contract?
 * see: https://github.com/nervosnetwork/godwoken-polyjuice/blob/ae65ef5/solidity/erc20/README.md#sudt-erc20-proxy-contract
 * 
 * How to deploy a sUDT-ERC20 Proxy Contract?
 * see:
 * 1. https://github.com/nervosnetwork/layer2-evm-documentation/blob/858fa76/.github/workflows/sudt-erc20-proxy.yml#L13-L51
 * 2. https://github.com/zhangyouxin/night-godwoken/blob/master/scripts/main.js
 */

const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { Networks } = require("../utils/network");

describe("sUDT-ERC20 Proxy Contract", () => {
  // sUDT-Proxy test environments for different networks
  const networks = {
    [Networks.GwTestnet_v1]: {
      contracts: {
        1: {
          sudtId: 6167,
          symbol: "pCKB",
          name: "pCKB",
          decimals: 18,
          tokenURI: "",
          address: "0xE05d380839f32bC12Fb690aa6FE26B00Bd982613",
          l1LockArgs: "",
        },
        6167: {
          sudtId: 6167,
          symbol: "dCKB",
          name: "NexisDAO dCKB",
          decimals: 18,
          tokenURI: "https://aggron.nexisdao.com/dckb",
          address: "0x7e54f7324902B72334827F40f613116F06a88845",
          l1LockArgs: "",
        },
        6571: {
          sudtId: 6571,
          symbol: "GWK",
          name: "Godwoken Test Token",
          decimals: 18,
          tokenURI: "",
          address: "0x2275Afe815dE66BeAbE7A2C03005537AB843afB2",
          l1LockArgs: "0x5c7253696786b9eddd34e4f6b6e478ec5742bd36569ec60c1d0487480ba4f9e3",
        },
        80: {
          sudtId: 80,
          symbol: "TTKN",
          name: "Godwoken Bridge Test Token",
          decimals: 18,
          tokenURI: "https://cryptologos.cc/logos/nervos-network-ckb-logo.svg?v=002",
          address: "0x088338e5Df007e2d7B38fd6A1eBc1EB766c6E360",
          l1LockArgs: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
        },
        29378: {
          sudtId: 29378,
          symbol: "DAI|eth",
          name: "Wrapped DAI (ForceBridge from Ethereum)",
          decimals: 18,
          tokenURI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=002",
          address: "0xAa41d1dEC760A9231Ad181d7932F5c6FBfb4dDb6",
          l1LockArgs: "0xcb8c7b352d88142993bae0f6a1cfc0ec0deac41e3377a2f7038ff6b103548353",
        },
        29407: {
          sudtId: 29407,
          symbol: "USDC|eth",
          name: "Wrapped USDC (ForceBridge from Ethereum)",
          decimals: 6,
          tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
          address: "0x678dc904ca5539184314beb9d9e753e2b0397aa6",
          l1LockArgs: "0x5497b6d3d55443d573420ca8e413ee1be8553c6f7a8a6e36bf036bf71f0e3c39",
        },
        29406: {
          sudtId: 29406,
          symbol: "USDT|eth",
          name: "Wrapped USDT (ForceBridge from Ethereum)",
          decimals: 6,
          tokenURI: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=002",
          address: "0xc8df91072917d3fed008c7bc1f1fcf8a8cc2c4f3",
          l1LockArgs: "0xf0a746d4d8df5c18826e11030c659ded11e7218b854f86e6bbdc2af726ad1ec3",
        },
        5681: {
          sudtId: 5681,
          symbol: "ETH|eth",
          name: "Wrapped ETH (ForceBridge from Ethereum)",
          decimals: 18,
          tokenURI: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002",
          address: "0x8bda183108dedcd0becfda0ce8989931fed6f7ba",
          l1LockArgs: "0x1b072aa0ded384067106ea0c43c85bd71bafa5afdb432123511da46b390a4e33",
        },
      },
      testTransferSudtId: 6571,
    },
    [Networks.GwMainnet_v1]: {
      contracts: {
        1: {
          sudtId: 1,
          symbol: "pCKB",
          name: "pCKB",
          decimals: 18,
          tokenURI: "",
          address: "0x7538C85caE4E4673253fFd2568c1F1b48A71558a",
          l1LockArgs: "",
        },
      },
      testTransferSudtId: 1,
    },
  };

  // https://github.com/nervosnetwork/godwoken-polyjuice/blob/d19f1e7/solidity/erc20/SudtERC20Proxy_UserDefinedDecimals.abi
  const abi = [{"inputs":[{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"},{"internalType":"uint256","name":"totalSupply_","type":"uint256"},{"internalType":"uint256","name":"sudtId_","type":"uint256"},{"internalType":"uint8","name":"decimals_","type":"uint8"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"sudtId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];

  // only test for defined networks
  if (!Object.keys(networks).includes(network.name)) {
    console.debug(`network ${network.name} is not supported in "sUDT-ERC20 Proxy Contract"`);
    return;
  }

  // testcase environment
  const env = networks[network.name];
  const transferSudt = env.contracts[env.testTransferSudtId];

  it("Print the infos of the sUDT-ERC20 Proxy Contracts", async () => {
    for (const id in env.contracts) {
      const { address } = env.contracts[id];
      const contract = await ethers.getContractAt(abi, address);

      const [sudtId, name, symbol, decimals, totalSupply] = await Promise.all([
        contract.sudtId(),
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.callStatic.totalSupply(),
      ]);

      console.log({ sudtId, symbol, name, decimals, address, totalSupply });
      expect(id).equal(sudtId);
    }
  });

  it(`Transfer ${transferSudt.name}`, async () => {
    const [sender, receiver] = await ethers.getSigners();
    const sudt = await ethers.getContractAt(abi, transferSudt.address);

    const [senderBalance, receiverBalance] = await Promise.all([
      sudt.callStatic.balanceOf(sender.address),
      sudt.callStatic.balanceOf(receiver.address),
    ]);
    console.debug(`${transferSudt.name} Balance of ${sender.address}:`, senderBalance);
    console.debug(`${transferSudt.name} Balance of ${receiver.address}:`, receiverBalance);

    const amount = 1;
    const tx = await sudt.transfer(receiver.address, amount);

    const receipt = await tx.wait();
    expect(receipt.events.length).to.be.greaterThan(0, "Should have at least one event");

    const [event] = receipt.events;
    expect(event.event).to.equal("Transfer", "Should be Transfer event");

    const { args } = event;
    expect(args.from).to.equal(sender.address, "Transferred from sender");
    expect(args.to).to.equal(receiver.address, "Transferred to receiver");
    expect(args.value.toNumber()).to.equal(amount, "Transfer amount should match");
  });
});
