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
const { isGwMainnetV1, isHardhatNetwork, isAxon} = require('../utils/network');

describe("Revertal", function () {
    // Skip for gw_mainnet_v1 network
    if (isGwMainnetV1()) {
        return;
    }
    // Skip for hardhat network
    if (isHardhatNetwork()) {
        return;
    }

    let revertalContract;
    let contractAddr;

    before(async function () {
        revertalContract = await ethers.deployContract("Revertal");
        contractAddr = await revertalContract.getAddress();
    });

    it("call Revertal.revert_null()", async () => {
        let callData = revertalContract.interface.encodeFunctionData("revert_null");
        let { message, data } = await sendEthCall(contractAddr, callData);

        expect(message).contains("execution reverted");
        if (isAxon()) {
          expect(data).to.equal("0x");
        } else {
          expect(data).undefined;
        }
    })

    it("call Revertal.revert_string()", async () => {
        let callData = revertalContract.interface.encodeFunctionData("revert_string", ["reason"]);
        let { message, data } = await sendEthCall(contractAddr, callData);
        expect(message).contains("execution reverted: reason");
        expect(data).eq("0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006726561736f6e0000000000000000000000000000000000000000000000000000");
    })

    it("call Revertal.revert_custom_error()", async () => {
        let callData = revertalContract.interface.encodeFunctionData("revert_custom_error", ["reason"]);
        let { message, data } = await sendEthCall(contractAddr, callData);
        expect(message).contains("execution reverted");
        expect(data).eq("0x8d6ea8be00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006726561736f6e0000000000000000000000000000000000000000000000000000");
    })

    it("call Revertal.panic()", async () => {
        let callData = revertalContract.interface.encodeFunctionData("panic");
        let { message, data } = await sendEthCall(contractAddr, callData);
        expect(message).contains("execution reverted");
        expect(data).eq("0x4e487b710000000000000000000000000000000000000000000000000000000000000001");
    })

    // panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)
    it("call Revertal.arithmetic_overflow()", async () => {
        let callData = revertalContract.interface.encodeFunctionData("arithmetic_overflow");
        let { message, data } = await sendEthCall(contractAddr, callData);
        expect(message).contains("execution reverted");
        expect(data).eq("0x4e487b710000000000000000000000000000000000000000000000000000000000000011");
    })
});

async function sendEthCall(toAddress, callData) {
    let signer = (await ethers.getSigners())[0].address;

    const response = await ethers.provider.call({
        to: toAddress,
        from: signer,
        data: callData,
    }).catch(err => {
        return {
            message: err.message,
            data: err.data
        };
    });

    return response;
}

/**
 * How to run this test?
 * > npx hardhat test test/Revertal --network gw_testnet_v1
 */