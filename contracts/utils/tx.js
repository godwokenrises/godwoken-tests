async function getTxReceipt(provider, txHash, count) {
    let response
    for (let i = 0; i < count; i++) {
        response = await provider.getTransactionReceipt(txHash);
        if (response == null) {
            await sleep(2000)

            continue;
        }
        if (response.confirmations >= 1) {
            return response
        }
        await sleep(2000)
    }
    return response
}

async function getGasPrice(provider) {
    let gasPrice = await provider.getGasPrice();
    return gasPrice.toHexString().replaceAll("0x0", "0x");
}

async function getTxCount(provider, address) {
    let loopMaxTime = 100000;
    while (true) {
        loopMaxTime--
        if (loopMaxTime < 0) {
            return
        }
        let pending_count = provider.getTransactionCount(address, "pending")
        let latest_count = provider.getTransactionCount(address, "latest")
        let blkNum = provider.getBlockNumber();
        console.log("address:", address, "nonce pending:", await pending_count, "latest :", await latest_count, ",blockNum:", await blkNum)
    }
}

async function sleep(timeOut) {
    await new Promise(r => setTimeout(r, timeOut));
}


module.exports = {
    getTxCount,
    getTxReceipt,
    getGasPrice,
};
