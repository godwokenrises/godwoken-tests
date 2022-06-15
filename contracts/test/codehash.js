const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("CodeHash test cases", function () {
  // ethers.provider.on('debug', (info) => {
  //     console.log("begin ------------------")
  //     console.log("action:", info.action);
  //     console.log("request", info.request);
  //     console.log("response:",info.response);
  //     console.log("end ------------------")
  // });
  const CODE = "0x608060405234801561001057600080fd5b50600436106100ea5760003560e01c8063a0914a361161008c578063c623032911610066578063c623032914610249578063cae7487414610267578063e11111b614610289578063ea879634146102a7576100ea565b8063a0914a36146101c7578063a0ad635e146101e5578063b1c8321c14610215576100ea565b80632b9ebc3b116100c85780632b9ebc3b146101355780635e3083ea1461015757806370907fab1461018757806376147d08146101a9576100ea565b80630d0567ae146100ef5780630ff879fa1461010d578063107956041461012b575b600080fd5b6100f76102c5565b6040516101049190610b66565b60405180910390f35b6101156102eb565b6040516101229190610c48565b60405180910390f35b6101336102f1565b005b61013d61045d565b60405161014e959493929190610b81565b60405180910390f35b610171600480360381019061016c9190610974565b6104db565b60405161017e9190610b66565b60405180910390f35b61018f6104e5565b6040516101a0959493929190610b81565b60405180910390f35b6101b16105b8565b6040516101be9190610bdb565b60405180910390f35b6101cf6105d7565b6040516101dc9190610bf6565b60405180910390f35b6101ff60048036038101906101fa9190610974565b610665565b60405161020c9190610c48565b60405180910390f35b61022f600480360381019061022a9190610974565b610686565b604051610240959493929190610b81565b60405180910390f35b61025161071d565b60405161025e9190610c48565b60405180910390f35b61026f610723565b604051610280959493929190610c63565b60405180910390f35b6102916107ef565b60405161029e9190610bdb565b60405180910390f35b6102af6107f5565b6040516102bc9190610bf6565b60405180910390f35b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60005481565b6102f961045d565b600160008060006002600060036000600460008a91905055899190505588919050908051906020019061032d92919061082f565b5087919050558691906101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050505050600054600560000181905550600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600560010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600260056002019080546103fc90610dbe565b6104079291906108b5565b506003546005600301819055506004546005600401819055507fef1805047aa43eafa087ab8005129b3913d5009272638959aec88a3d06af966660016005604051610453929190610c18565b60405180910390a1565b600080606060008030473073ffffffffffffffffffffffffffffffffffffffff16803b806020016040519081016040528181526000908060200190933c3073ffffffffffffffffffffffffffffffffffffffff163b3073ffffffffffffffffffffffffffffffffffffffff163f945094509450945094509091929394565b6000819050919050565b6000806060600080600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600054600260035460045482805461052790610dbe565b80601f016020809104026020016040519081016040528092919081815260200182805461055390610dbe565b80156105a05780601f10610575576101008083540402835291602001916105a0565b820191906000526020600020905b81548152906001019060200180831161058357829003601f168201915b50505050509250945094509450945094509091929394565b60003073ffffffffffffffffffffffffffffffffffffffff163f905090565b600280546105e490610dbe565b80601f016020809104026020016040519081016040528092919081815260200182805461061090610dbe565b801561065d5780601f106106325761010080835404028352916020019161065d565b820191906000526020600020905b81548152906001019060200180831161064057829003601f168201915b505050505081565b60008173ffffffffffffffffffffffffffffffffffffffff16319050919050565b6000806060600080858673ffffffffffffffffffffffffffffffffffffffff16318773ffffffffffffffffffffffffffffffffffffffff16803b806020016040519081016040528181526000908060200190933c8873ffffffffffffffffffffffffffffffffffffffff163b8973ffffffffffffffffffffffffffffffffffffffff163f9450945094509450945091939590929450565b60035481565b60058060000154908060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169080600201805461076090610dbe565b80601f016020809104026020016040519081016040528092919081815260200182805461078c90610dbe565b80156107d95780601f106107ae576101008083540402835291602001916107d9565b820191906000526020600020905b8154815290600101906020018083116107bc57829003601f168201915b5050505050908060030154908060040154905085565b60045481565b60603073ffffffffffffffffffffffffffffffffffffffff16803b806020016040519081016040528181526000908060200190933c905090565b82805461083b90610dbe565b90600052602060002090601f01602090048101928261085d57600085556108a4565b82601f1061087657805160ff19168380011785556108a4565b828001600101855582156108a4579182015b828111156108a3578251825591602001919060010190610888565b5b5090506108b19190610942565b5090565b8280546108c190610dbe565b90600052602060002090601f0160209004810192826108e35760008555610931565b82601f106108f45780548555610931565b8280016001018555821561093157600052602060002091601f016020900482015b82811115610930578254825591600101919060010190610915565b5b50905061093e9190610942565b5090565b5b8082111561095b576000816000905550600101610943565b5090565b60008135905061096e81610e90565b92915050565b60006020828403121561098a57610989610e6d565b5b60006109988482850161095f565b91505092915050565b6109aa81610d33565b82525050565b6109b981610d33565b82525050565b6109c881610d45565b82525050565b6109d781610d45565b82525050565b60006109e882610cd2565b6109f28185610cee565b9350610a02818560208601610d8b565b610a0b81610e72565b840191505092915050565b60008154610a2381610dbe565b610a2d8186610cdd565b94506001821660008114610a485760018114610a5a57610a8d565b60ff1983168652602086019350610a8d565b610a6385610cbd565b60005b83811015610a8557815481890152600182019150602081019050610a66565b808801955050505b50505092915050565b610a9f81610d79565b82525050565b600060a083016000808401549050610abc81610e24565b610ac96000870182610b48565b5060018401549050610ada81610df0565b610ae760208701826109a1565b50600284018583036040870152610afe8382610a16565b92505060038401549050610b1181610e24565b610b1e6060870182610b48565b5060048401549050610b2f81610e0a565b610b3c60808701826109bf565b50819250505092915050565b610b5181610d6f565b82525050565b610b6081610d6f565b82525050565b6000602082019050610b7b60008301846109b0565b92915050565b600060a082019050610b9660008301886109b0565b610ba36020830187610b57565b8181036040830152610bb581866109dd565b9050610bc46060830185610b57565b610bd160808301846109ce565b9695505050505050565b6000602082019050610bf060008301846109ce565b92915050565b60006020820190508181036000830152610c1081846109dd565b905092915050565b6000604082019050610c2d6000830185610a96565b8181036020830152610c3f8184610aa5565b90509392505050565b6000602082019050610c5d6000830184610b57565b92915050565b600060a082019050610c786000830188610b57565b610c8560208301876109b0565b8181036040830152610c9781866109dd565b9050610ca66060830185610b57565b610cb360808301846109ce565b9695505050505050565b60008190508160005260206000209050919050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b6000819050919050565b6000610d3e82610d4f565b9050919050565b6000819050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b6000610d8482610d6f565b9050919050565b60005b83811015610da9578082015181840152602081019050610d8e565b83811115610db8576000848401525b50505050565b60006002820490506001821680610dd657607f821691505b60208210811415610dea57610de9610e3e565b5b50919050565b6000610e03610dfe83610e83565b610cff565b9050919050565b6000610e1d610e1883610e83565b610d1f565b9050919050565b6000610e37610e3283610e83565b610d29565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600080fd5b6000601f19601f8301169050919050565b60008160001c9050919050565b610e9981610d33565b8114610ea457600080fd5b5056fea2646970667358221220d49b829af1a85e9171cd7bda083e2f8586628a8c3a5de15fc3a7ebe0dd0fce8864736f6c63430008060033";
  const CODE_LEN = (CODE.length - 2) / 2;
  const CODEHASH = "0xfd45380418f61162927e4631f4cb5c8c1680066f7eba8491781a7e09b52f9d91"

  let contract1 = { address: "" }; // 0xc0dEE6Bbd23103d5Dd4141A459f92961b940F94c
  let contract2 = { address: "" }; // 0xB8407eE45824832c137C23479A3Cd63bd78B2452
  let blockInfoContractFact;

  before(async function () {
    blockInfoContractFact = await ethers.getContractFactory("AddressContract");

    if (contract1.address) {
      contract1 = await ethers.getContractAt("AddressContract", contract1.address);
    } else {
      contract1 = await blockInfoContractFact.deploy({ value: 10000n });
      await contract1.deployed();
      console.log("deployed contract1 address:", contract1.address);
    }

    if (contract2.address) {
      contract2 = await ethers.getContractAt("AddressContract", contract2.address);
    } else {
      contract2 = await blockInfoContractFact.deploy({ value: 101n });
      await contract2.deployed();
      console.log("deployed contract2 address:", contract2.address);
    }
  });

  it("Get codehash", async () => {
    const codehash1 = await contract1.getCodehash();
    expect(codehash1).to.equal(CODEHASH);

    const codehash2 = await contract2.getCodehash();
    expect(codehash2).to.equal(CODEHASH);
  });

  it("Get the contract code", async () => {
    const code = await contract1.getCode();
    expect(code.length).to.equal(CODE.length);
    expect(code).to.equal(CODE);
  });

  it.skip("opcode - (query log for deploy)", async () => {
    let result = await contract2.deployTransaction.wait();
    expect(result.events[0].args.msg.latestBalance).to.equal(101n);
    expect(result.events[0].args.msg.latestAddress).to.equal(contract2.address);
    expect(result.events[0].args.msg.latestCode).to.equal("0x");
    expect(result.events[0].args.msg.latestCodeLength).to.equal(0n);

    return;
    // Only support getting codehash after the contract created.
    // AssertionError: expected latestCodeHash to equal CODEHASH
    expect(result.events[0].args[1].latestCodeHash).to.equal(CODEHASH);
  });

  it("opcode query(opcodeWithAddress) ", async () => {
    let result = await contract1.opcodeWithAddress();
    let code = await ethers.provider.getCode(contract1.address)
    expect(result[0]).to.equal(contract1.address)
    expect(result[1]).to.equal(10000n)
    expect(result[2]).to.equal(code)
    expect(result[4]).to.equal(CODEHASH);
  });

  it("opcode - (ADDRESS,CODESIZE,EXTCODESIZE,SELFBALANCE) query on deploy", async () => {
    let tx = await contract1.setAddressMsg();
    let result = await tx.wait();
    expect(result.events[0].args[1].latestBalance).to.equal(10000n);
    expect(result.events[0].args[1].latestAddress).to.equal(contract1.address);
    expect(result.events[0].args[1].latestCode).to.not.be.contains(
      "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
    expect(result.events[0].args[1].latestCodeLength).to.equal(CODE_LEN);
    expect(result.events[0].args[1].latestCodeHash).to.equal(CODEHASH);
  });

  // unregistered ETH Address
  const unregEthAddr = "0x666c3Be470198290d21f5C86327a556d58446678";
  it("Interact with an unregistered address", async () => {
    let result = await contract1.getOtherAddr(unregEthAddr);
    expect(result).equals(unregEthAddr);

    result = await contract1.getOtherAddressBalance(unregEthAddr);
    expect(result).to.equal(0n)
  });

  // One must create an account on a Godwoken chain in order to use Polyjuice on
  // that Godwoken chain.
  // see: https://github.com/nervosnetwork/godwoken/blob/compatibility-breaking-changes/docs/known_caveats_of_polyjuice.md#account-creation
  // 
  // Godwoken v1.1 support ineracting with an eth_address that hasn't been
  // registered on Godwoken.
  //
  // see: Godwoken v1.1 Milestone
  it.skip("Interact with an eth_address that hasn't been registered", async () => {
    let result = await contract1.getOtherAddress(unregEthAddr);
    // unregEthAddr
    expect(result[0]).to.equal(unregEthAddr);
    // unregEthAddr.balance
    expect(result[1]).to.equal(0n)

    /**
     * Not supported:

    // unregEthAddr.code
    expect(result[2]).to.equal("0x")
    // unregEthAddr.code.length
    expect(result[3]).to.equal(0n)
    // unregEthAddr.codehash
    expect(result[4]).to.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000")
     */
  });
})

/**
 * How to run this test?

> npx hardhat --network gw_testnet_v1 test test/codehash.js && \
  npx hardhat --network hardhat test test/codehash.js
 */
