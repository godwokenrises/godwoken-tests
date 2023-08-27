const { expect } = require("chai");
const { isAxon } = require('../utils/network');
const { ethers, network } = require("hardhat");
const request = require('sync-request');

let jsonRPCID = 1;

async function sendRpc(method, params) {
    // Set up the JSON-RPC request object
    const requestObject = {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: jsonRPCID
    };

    jsonRPCID += 1;

    // Send the request
    const rpcUrl = network.config.url;

    const res = request('POST', rpcUrl, { json: requestObject });
    console.log(res.statusCode);
    return JSON.parse(res.getBody('utf-8')).result;
}

function numToByte(n) {
    const byteArray = [0, 0, 0, 0];

    for (let index = 0; index < byteArray.length; index++) {
        let byte = n & 0xff;
        byteArray[index] = byte;
        n = (n - byte) / 256;
    }

    return Buffer.from(byteArray).toString('hex');
}

describe("Overwrite code hash", function () {
    // This test should be only related with godwoken.
    if (isAxon()) {
        return
    }
    it("Overwrite", async () => {
        // This is a polyjuice bug
        // Godwoken stores all data into a single sparse merkle tree. Typically, the user
        // level storage and the system level are strictly isolated. But this bug causes a 
        // system value - the code of an account, written into user's storage, so if we
        // calculated the key correctly, we can overrite the code from user level.
        const OverwriteCodeHash = await ethers.getContractFactory("OverwriteCodeHash");
        const contract = await OverwriteCodeHash.deploy();
        await contract.waitForDeployment();
        const contractAddress= await contract.getAddress();
        console.log(`contract address: ${contractAddress}`);

        // query godwoken account id
        // Set up the JSON-RPC request object
        console.log("param", `0x0200000041000000${contractAddress.slice(2,)}`);
        const scriptHash = await sendRpc('gw_get_script_hash_by_registry_address', [`0x0200000014000000${contractAddress.slice(2,)}`]);
        console.log('script hash', scriptHash);
        const accountId = await sendRpc('gw_get_account_id_by_script_hash', [scriptHash]);
        console.log('account Id', accountId);

        // calculate key of code_hash
        const key = `0x${numToByte(accountId)}ff010000000000000000000000000000000000000000000000000000`;
        console.log('key', key);

        // access
        const codehash0 = await contract.loadInner(key);
        console.log('original code hash', codehash0);
        expect(codehash0).to.not.eq("0x0000000000000000000000000000000000000000000000000000000000000000");

        // overwrite
        const blockInfoContractFact = await ethers.getContractFactory("AddressContract");
        const contract1 = await blockInfoContractFact.deploy();
        await contract1.waitForDeployment();
        const codehash1 = await contract1.getFunction("getCodehash").staticCall();

        let failedToOverwrite = false;

        try {
            const tx = await contract.getFunction("storeInner").send(key, codehash1);
            await tx.wait();
            console.log('overwrite success');
        } catch (_e) {
            console.log('failed to overwrite', _e);
            failedToOverwrite = true;
        }

        expect(failedToOverwrite).to.eq(true);

        const value = await contract.getFunction("loadInner").staticCall(key);
        expect(value).to.eq(codehash0);
    });
});
