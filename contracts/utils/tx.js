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

async function sleep(timeOut) {
    await new Promise(r => setTimeout(r, timeOut));
}


module.exports = {
    getTxReceipt,
    getGasPrice,
};
