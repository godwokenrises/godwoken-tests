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

const {expect} = require("chai");
const {network, ethers} = require("hardhat");
const {isGwMainnetV1, isHardhatNetwork} = require('../utils/network');
const {fetchJson} = require("ethers/lib/utils");

describe("Revertal", function () {
    // Skip for gw_mainnet_v1 network
    if (isGwMainnetV1()) {
        return;
    }
    // Skip for hardhat network
    if (isHardhatNetwork()) {
        return;
    }

    let revertal;

    before(async function () {
        const contract = await ethers.getContractFactory("Revertal");
        revertal = await contract.deploy();
        await revertal.deployed();
    });

    it("call Revertal.revert_null()", async () => {
        let callData = revertal.interface.encodeFunctionData("revert_null");
        let {error: {message, data}} = await sendEthCall(revertal.address, callData);
        expect(message).contains("execution reverted");
        expect(data).undefined;
    })

    it("call Revertal.revert_string()", async () => {
        let callData = revertal.interface.encodeFunctionData("revert_string", ["reason"]);
        let {error: {message, data}} = await sendEthCall(revertal.address, callData);
        expect(message).contains("execution reverted: reason");
        expect(data).eq("0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006726561736f6e0000000000000000000000000000000000000000000000000000");
    })

    it("call Revertal.revert_custom_error()", async () => {
        let callData = revertal.interface.encodeFunctionData("revert_custom_error", ["reason"]);
        let {error: {message, data}} = await sendEthCall(revertal.address, callData);
        expect(message).contains("execution reverted");
        expect(data).eq("0x8d6ea8be00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006726561736f6e0000000000000000000000000000000000000000000000000000");
    })

    it("call Revertal.panic()", async () => {
        let callData = revertal.interface.encodeFunctionData("panic");
        let {error: {message, data}} = await sendEthCall(revertal.address, callData);
        expect(message).contains("execution reverted");
        expect(data).eq("0x4e487b710000000000000000000000000000000000000000000000000000000000000001");
    })

    it("call Revertal.arithmetic_overflow()", async () => {
        let callData = revertal.interface.encodeFunctionData("arithmetic_overflow");
        let {error: {message, data}} = await sendEthCall(revertal.address, callData);
        expect(message).contains("execution reverted");
        expect(data).eq("0x4e487b710000000000000000000000000000000000000000000000000000000000000011");
    })
});

async function sendEthCall(toAddress, callData) {
    let signer = (await ethers.getSigners())[0].address;
    let request =
        {
            jsonrpc: "2.0",
            id: 0,
            method: "eth_call",
            params: [{
                to: toAddress,
                from: signer,
                nonce: "0x" + (await ethers.provider.getTransactionCount(signer)).toString(16),
                data: callData,
            }, "latest",]
        };

    // NOTE: `network.config.url` works only for external networks. Using Hardhat network, I don't know how to retrieve
    //       the actual URL.
    // NOTE: `ethers.provider.send` and other APIs wraps the response handling, while we want to compare the original
    //       response from the provider.
    const response = await fetchJson(network.config.url, JSON.stringify(request));
    // console.log("response: ", response);
    return response;
}
