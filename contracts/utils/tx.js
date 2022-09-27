const {ethers} = require("hardhat");

async function getTxReceipt(provider, txHash, count) {
    let response
    for (let i = 0; i < count; i++) {
        response = await provider.getTransactionReceipt(txHash);
        if (response == null) {
            await sleep(2000)

            continue;
        }
        if (response.confirmations === 1) {
            return response
        }
        await sleep(2000)
    }
    return response
}

async function getGasPrice(provider) {
    let gasPrice = await provider.getGasPrice();
    if (gasPrice < 16) {
        return "0x" + gasPrice._hex.toLowerCase().replaceAll("0x0", "");
    }
    return gasPrice.toHexString().replaceAll("0x0", "0x");
}

function BigInterToHexString(bn) {
    if (bn < 16) {
        return "0x" + bn.toHexString().replaceAll("0x0", "");
    }
    return bn.toHexString().replaceAll("0x0", "0x");
}

async function sendTxCount(provider, count) {
    let contractAddress = await ethers.provider.getSigner(0).getAddress()
    for (let i = 0; i < count; i++) {
        let txCount = provider.getTransactionCount(contractAddress);
        console.log(contractAddress, " count:", await txCount)
        await sendRandomTx(provider)
    }
    console.log("send successful:", count)
}

async function sendTxToAddBlockNum(provider, blockNum) {

    let endNum = await provider.getBlockNumber() + blockNum;
    let currentNum = await provider.getBlockNumber();
    console.log("currentNum:", currentNum, " end:", endNum)
    let contractAddress = await ethers.provider.getSigner(0).getAddress()
    while (currentNum < endNum) {
        let txCount = provider.getTransactionCount(contractAddress);
        console.log(contractAddress, " count:", await txCount)
        await sendRandomTx(provider)
        currentNum = await provider.getBlockNumber();
        console.log("currentNum:", currentNum, " end:", endNum)
    }
    console.log("curren block num:", endNum)
}

async function getTxCount(provider, address) {
    let loopMaxTime = 100000;
    while (true) {
        loopMaxTime--
        if(loopMaxTime<0){
            return
        }
        let pending_count = provider.getTransactionCount(address, "pending")
        let latest_count = provider.getTransactionCount(address, "latest")
        let blkNum = provider.getBlockNumber();
        console.log("address:", address, "nonce pending:", await pending_count, "latest :", await latest_count, ",blockNum:", await blkNum)
    }
}

async function sendRandomTx(provider) {
    let from = (await ethers.getSigners())[1].address
    let logContract = await ethers.getContractFactory("opcode_assembly_log");
    try {
        await provider.send("eth_sendTransaction", [{
            "from": from,
            "data": logContract.bytecode
        }]);
    } catch (e) {
    }
}

async function sleep(timeOut){
    await new Promise(r => setTimeout(r, timeOut));
}


module.exports = {
    getTxCount,
    getTxReceipt,
    getGasPrice,
    // BigInterToHexString,
    // sendTxToAddBlockNum,
    // sendTxCount
};
