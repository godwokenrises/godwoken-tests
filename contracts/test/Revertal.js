/**
 * This file ensures that the provider returns the same error message structure as Geth for kinds of revert errors.
 *
 * | revert fashion in Solidity | evm.result.ReturnData | jsonrpc.result |
 * | :--- | :--- | :--- |
 * | revert() | "" | { code: -32000, message: 'execution reverted' } |
 * | revert("reason") | RevertErrorSelector + DataOffset + StringLength + StringData | { code: -32000, message: 'execution reverted: reason', data: evm.result.ReturnData.hexadecimal()" } |
 * | revert CustomError("reason") | ... | { code: -32000, message: 'execution reverted' } |
 *
 * Ref:
 * - https://docs.soliditylang.org/en/latest/contracts.html#errors
 * - https://docs.soliditylang.org/en/latest/control-structures.html#error-handling-assert-require-revert-and-exceptions
 * - https://www.tutorialspoint.com/solidity/solidity_error_handling.htm
 *
 * Note:
 * - Discard the `code` field in the JSONRPC response, as Godwoken's error codes are different from Geth
 * - Discard the `code` field in `error` in the JSONRPC response, as Godwoken's error codes are different from Geth
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isGwMainnetV1, isAxon, isGw } = require('../utils/network');

describe("Revertal", function () {
  // Skip for gw_mainnet_v1 network
  if (isGwMainnetV1()) {
    return;
  }

  let revertalContract;
  let contractAddr;

  before(async function () {
    const Revertal = await ethers.getContractFactory("Revertal");
    const deployTransaction = await Revertal.deploy();
    revertalContract = await deployTransaction.waitForDeployment();
    contractAddr = await revertalContract.getAddress();
  });

  it("call Revertal.revert_null()", async () => {
    // 'missing revert data in call exception; Transaction reverted without a reason string
    // [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ]
    // (data="0x", error={"name":"ProviderError","_stack":"ProviderError: execution reverted
    // "code":-32000,"_isProviderError":true}, code=CALL_EXCEPTION, version=providers/5.7.2)'
    const callData = revertalContract.interface.encodeFunctionData("revert_null");
    const tx = {
      to: contractAddr,
      data: callData
    };
    try {
      const result = await ethers.provider.call(tx);
      // no error was catched in Axon or hardhat network
      expect(result).to.equal("0x");
    } catch (error) {
      // error was catched in Godwoken networks
      expect(error.message).contains("execution reverted");
      if (isAxon()) {
        expect(error.data).to.equal("0x");
      }
    }
  })

  it("call Revertal.revert_string()", async () => {
    // 'call revert exception; VM Exception while processing transaction: reverted with reason string "reasonXYZ"
    // [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="revert_string(string)"
    const { message, data } = await revertalContract.getFunction("revert_string").staticCall("reasonXYZ").catch(e => e);
    // errorArgs=["reasonXYZ"], errorName="Error", errorSignature="Error(string)", reason="reasonXYZ", code=CALL_EXCEPTION, version=abi/5.7.0)'
    expect(message).contains("reverted");
    expect(message).contains("reasonXYZ");
    expect(data).eq("0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000009726561736f6e58595a0000000000000000000000000000000000000000000000");
  })

  it("call Revertal.revert_custom_error()", async () => {
    const err = await revertalContract.getFunction("revert_custom_error").staticCall("reasonABC").catch(err => err);
    const { message, data } = err;
    if (isAxon()) {
      expect(message).contains("execution reverted: reasonABC");
    } else if (isGw()) {
      expect(message).eq("execution reverted");
    }
    expect(data).eq("0x8d6ea8be00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000009726561736f6e4142430000000000000000000000000000000000000000000000");
  })

  it("call Revertal.panic()", async () => {
    // 'call revert exception; VM Exception while processing transaction: reverted with panic code 1
    // [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ]
    // (method="panic()", errorArgs=[{"type":"BigNumber","hex":"0x01"}], errorName="Panic", errorSignature="Panic(uint256)", reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)'
    const err = await revertalContract.getFunction("panic").staticCall().catch(err => err);
    const { message, data } = err;
    if (isAxon()) {
      expect(message).contains("execution reverted");
    } else if (isGw()) {
      expect(message).eq("execution reverted: panic code 0x1 (Assertion error)");
    }
    expect(data).eq("0x4e487b710000000000000000000000000000000000000000000000000000000000000001");
  })

  // panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)
  it("call Revertal.arithmetic_overflow()", async () => {
    // 'call revert exception; VM Exception while processing transaction: reverted with panic code 17
    // [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ]
    // (method="arithmetic_overflow()", errorArgs=[{"type":"BigNumber","hex":"0x11"}], errorName="Panic", errorSignature="Panic(uint256)", reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)'
    const err = await revertalContract.getFunction("arithmetic_overflow").staticCall().catch(err => err);
    const { message, data } = err;
    if (isAxon()) {
      expect(message).contains("execution reverted");
    } else if (isGw()) {
      expect(message).eq("execution reverted: panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)");
    }
    expect(data).eq("0x4e487b710000000000000000000000000000000000000000000000000000000000000011");
  })
});

/**
 * How to run this test?
 * > npx hardhat test test/Revertal --network gw_testnet_v1
 */
