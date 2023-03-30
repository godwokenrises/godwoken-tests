const {ethers} = require("hardhat");
const {expect} = require("chai");

describe("bn256 ", function () {
    this.timeout(60000)
    let contract;

    before(async function () {
        const Bn256 = await ethers.getContractFactory("Bn256");
        contract = await Bn256.deploy();
        await contract.deployed();
    });

    it("0x06 legal input", async () => {
        const tx = await contract.callBn256Add(numberToBytes32(1), numberToBytes32(2), numberToBytes32(1), numberToBytes32(2));
        const receipt = await tx.wait();
        expect(receipt.status).to.be.equal(1);
    })

    it.skip("0x06 illegal input", async () => {
        const signers = await ethers.getSigners();
        const from = signers[0].address;
        const to = contract.address;
        const gas = "0xaeeb";
        const gasPrice = await getGasPrice(ethers.provider);
        const data = "0x4849f2790000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"
        // const from_balance = await ethers.provider.getBalance(from)
        // console.log(`before tx from_balance(${from.substring(0, 6)}):${from_balance}`)
        const tx = await ethers.provider.send("eth_sendTransaction", [{
            from,
            to,
            "gas": gas,
            "gasPrice": gasPrice,
            "data": data
        }])
        const receipt = await getTxReceipt(ethers.provider, tx, 100)
        // receipt.status: 1 (success) or 0 (failure)
        expect(receipt.status).to.be.equal(0);
        expect(receipt.gasUsed > 0).to.be.true
        // const from_balance_sent = await ethers.provider.getBalance(from)
        // console.log(`before tx from_balance(${from.substring(0, 6)}):${from_balance_sent}`)
        // expect(from_balance.sub(from_balance_sent)).to.be.equal(receipt.gasUsed.mul(gasPrice))
    })
});

async function numberToBytes32(amount) {
    return ethers.utils.hexZeroPad(ethers.BigNumber.from(amount), 32)
}

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
