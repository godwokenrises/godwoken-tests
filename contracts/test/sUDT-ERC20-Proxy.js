/**
 * On testnet, one developer could deploy their own sUDT_ERC20_Proxy contract;
 * while on mainnet, sUDT_ERC20_Proxy should only be deployed by the core team.
 * 
 * What is a sUDT-ERC20 Proxy Contract?
 * see: https://github.com/nervosnetwork/godwoken-polyjuice/blob/ae65ef5/solidity/erc20/README.md#sudt-erc20-proxy-contract
 * 
 * How to deploy a sUDT-ERC20 Proxy Contract?
 * see: https://github.com/nervosnetwork/layer2-evm-documentation/blob/858fa76/.github/workflows/sudt-erc20-proxy.yml#L13-L51
 * 
 * These are ERC20 token addresses on Godwoken testnet_v1:
    CKB: 0xE05d380839f32bC12Fb690aa6FE26B00Bd982613
    ETH (from Rinkeby Force Bridge): 0x0902574C86aEc810B727fD08Aa186DBC20579c08
    USDC (from Rinkeby Force Bridge): 0x630AcC0A29E325ce022563Df69ba7E25Eeb1e184
    USDT (from Rinkeby Force Bridge): 0x10A86c9C8CbE7cf2849bfCb0EaBE39b3bFEc91D4
    DAI (from Rinkeby Force Bridge): 0xA2370D7aFFf03e1E2FB77b28Fb65532636e0cB61
    USDC (from https://testnet.bridge.godwoken.io): 0x30D4B957139785B979aF5312d71505809dc563ed
    dCKB (from https://aggron.nexisdao.com/dckb): 0x7e54f7324902B72334827F40f613116F06a88845
    GWK (Godwoken test token): 0x2275Afe815dE66BeAbE7A2C03005537AB843afB2

   ref: https://nervos.gitbook.io/layer-2-evm/tasks/4.-use-force-bridge-to-deposit-tokens-from-ethereum#check-your-layer-2-balance
 */

const { ethers, network } = require("hardhat");
const { expect } = require("chai");

describe("sUDT-ERC20 Proxy Contract", () => {
  // only test for testnet_v1
  if (71401 !== network.config.chainId) {
    console.debug('only test for testnet_v1, NOT', network.config);
    return;
  }

  // https://github.com/nervosnetwork/godwoken-polyjuice/blob/d19f1e7/solidity/erc20/SudtERC20Proxy_UserDefinedDecimals.abi
  const abi = [{"inputs":[{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"},{"internalType":"uint256","name":"totalSupply_","type":"uint256"},{"internalType":"uint256","name":"sudtId_","type":"uint256"},{"internalType":"uint8","name":"decimals_","type":"uint8"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"sudtId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
  
  let proxyContracts = { // sudtId: contractAddress
    1: '0xE05d380839f32bC12Fb690aa6FE26B00Bd982613',
    5681: '0x0902574C86aEc810B727fD08Aa186DBC20579c08',
    29407: '0x630AcC0A29E325ce022563Df69ba7E25Eeb1e184',
    29406: '0x10A86c9C8CbE7cf2849bfCb0EaBE39b3bFEc91D4',
    29378: '0xA2370D7aFFf03e1E2FB77b28Fb65532636e0cB61',
    80: '0x30D4B957139785B979aF5312d71505809dc563ed',
    6167: '0x7e54f7324902B72334827F40f613116F06a88845',
    6571: '0x2275Afe815dE66BeAbE7A2C03005537AB843afB2',
  };

  it("Print the infos of the sUDT-ERC20 Proxy Contracts", async function() {
    for (const id in proxyContracts) {
      const addr = proxyContracts[id];
      const contract = await ethers.getContractAt(abi, addr);

      const [sudtId, name, symbol, decimals, totalSupply] = await Promise.all([
        contract.sudtId(),
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.callStatic.totalSupply()
      ]);
      console.log({symbol, name, symbol, decimals, addr, totalSupply});
      expect(id).equal(sudtId);
    }
  });

  it("Transfer GWK", async function() {
    // The issuer of GWK
    const signerAddr = "0x8291507afda0bba820efb6dfa339f09c9465215c";
    const signer = await ethers.getSigners().then(signers => signers.find(
      s => s.address.toLowerCase() == signerAddr
    ));
    if (signer == null) throw new Error("Signer not found");

    // GWK sUDT_ERC20_Proxy contract
    let gwkContract = await ethers.getContractAt(abi, proxyContracts["6571"]);
    gwkContract = gwkContract.connect(signer);

    const amount = 1n;
    const receiver = await ethers.getSigner();
    let receiverBalance = await gwkContract.callStatic.balanceOf(receiver.address);
    let senderBalance = await gwkContract.callStatic.balanceOf(signerAddr);

    await gwkContract.transfer(receiver.address, amount);
    expect(await gwkContract.callStatic.balanceOf(receiver.address))
      .equals(BigInt(receiverBalance) + amount);
    expect(await gwkContract.callStatic.balanceOf(signerAddr))
      .equals(BigInt(senderBalance) - amount);
    console.debug("receiverBalance", receiverBalance);    
  });
});

