import hardhat from "hardhat"
import chai from "chai"
import {getGasPrice, getTxReceipt} from "../utils/tx.js"

import {isGwMainnetV1} from "../utils/network.js"

const {ethers} = hardhat
const {expect} = chai
const {BigNumber} = ethers

let gasPrice, EOA0, EOA1, newEOA0, CA0

if (!isGwMainnetV1()) {
    gasPrice = await getGasPrice(ethers.provider)
    EOA0 = (await ethers.getSigners())[0].address
    EOA1 = (await ethers.getSigners())[1].address
    newEOA0 = ethers.Wallet.createRandom().address
    const baseFallbackReceive = await ethers.getContractFactory("baseFallbackReceive")
    const contract = await baseFallbackReceive.deploy()
    await contract.deployed()
    CA0 = contract.address
}

describe("transfer success", function () {
    if (isGwMainnetV1()) {
        return;
    }

    const tests = [
        {name: "to EOA", from: EOA0, to: EOA1, value: "0x1", expectGasUsed: "21000"},
        {name: "to EOA tx.data is not null", from: EOA0, to: EOA1, value: "0x1", data: "0x12", expectGasUsed: "21016"},
        {name: "to itself", from: EOA0, to: EOA0, value: "0x10", expectGasUsed: "21000"},
        {name: "transfer 0", from: EOA0, to: EOA1, value: "0x0", expectGasUsed: "21000"},
        {name: "transfer big value", from: EOA0, to: EOA1, value: "0x8ac7230489e80000", expectGasUsed: "21000"},
        {name: "to new EOA", from: EOA0, to: newEOA0, value: "0x100", expectGasUsed: "46000"},
        {name: "to CA", from: EOA0, to: CA0, value: "0x200", expectGasUsed: "21033"},
        {name: "to CA tx.data is not null", from: EOA0, to: CA0, data: "0x12", value: "0x300", expectGasUsed: "21050"},
    ]

    for (let i = 0; i < tests.length; i++) {
        let test = tests[i]
        it(test.name, async () => {
            const from_balance = await ethers.provider.getBalance(test.from)
            const to_balance = await ethers.provider.getBalance(test.to)
            console.log(`before transfer from balance:${from_balance} to balance:${to_balance}`)
            const response = await tranfer(test.from, test.to, test.value, test.data)
            const estimatedGas = await estGas(test.from, test.to, test.value, test.data)
            const from_balance_sent = await ethers.provider.getBalance(test.from)
            const to_balance_sent = await ethers.provider.getBalance(test.to)
            console.log('after transfer from balance:%s to balance:%s gasPrice:%s fee:%s estimatedGas:%s', from_balance_sent, to_balance_sent, parseInt(gasPrice, 16), response.gasUsed.mul(gasPrice).toString(), parseInt(estimatedGas, 16))
            expect(response.gasUsed).to.be.equal(test.expectGasUsed)
            expect(estimatedGas).to.be.least(response.gasUsed)
            if (test.from === test.to) {
                //from_balance-from_balance_sent=gasUsed*gasPrice
                expect(from_balance.sub(from_balance_sent)).to.be.equal(response.gasUsed.mul(gasPrice))
            } else {
                //from_balance-from_balance_sent=value+gasUsed*gasPrice
                //to_balance_sent-to_balance=value
                expect(from_balance.sub(from_balance_sent)).to.be.equal(BigNumber.from(test.value).add(response.gasUsed.mul(gasPrice)))
                expect(to_balance_sent.sub(to_balance)).to.be.equal(BigNumber.from(test.value))
            }
        }).timeout(20000)
    }

    after(async function () {
        this.timeout(10000);
        const test = tests.find(v => v.name === 'transfer big value');
        if (!!test) {
            const from_balance = await ethers.provider.getBalance(test.from)
            const to_balance = await ethers.provider.getBalance(test.to)
            console.log('before final transfer from balance:%s to balance:%s', from_balance, to_balance)
            await tranfer(test.to, test.from, test.value)
            const from_balance_final = await ethers.provider.getBalance(test.from)
            const to_balance_final = await ethers.provider.getBalance(test.to)
            console.log('after final transfer from balance:%s to balance:%s', from_balance_final, to_balance_final)
        }
    })
})

describe("transfer failed", function () {
    if (isGwMainnetV1()) {
        return;
    }

    const from = EOA0
    const to = EOA1
    it("gasLimit not enough", async () => {
        const from_balance = await ethers.provider.getBalance(from)
        const to_balance = await ethers.provider.getBalance(to)
        console.log('before transfer from balance:%s to balance:%s', from_balance, to_balance)
        try {
            await ethers.provider.send("eth_sendTransaction", [{
                "from": from,
                "to": to,
                "gas": "0x100",
                "gasPrice": gasPrice,
                "value": "0x1"
            }])
        } catch (e) {
            expect(e.toString()).to.be.contains("intrinsic Gas too low")
        } finally {
            const from_balance_sent = await ethers.provider.getBalance(from)
            const to_balance_sent = await ethers.provider.getBalance(to)
            console.log('after transfer from balance:%s to balance:%s', from_balance_sent, to_balance_sent)
            expect(from_balance).to.be.equal(from_balance_sent)
            expect(to_balance).to.be.equal(to_balance_sent)
        }
    }).timeout(15000)

    it("balance not enough", async () => {
        const from_balance = await ethers.provider.getBalance(from)
        const to_balance = await ethers.provider.getBalance(to)
        console.log('before transfer from balance:%s to balance:%s', from_balance, to_balance)
        try {
            await tranfer(from, to, "0x845951614014880000000")
        } catch (e) {
            expect(e.toString()).to.be.contains("insufficient balance")
        } finally {
            const from_balance_sent = await ethers.provider.getBalance(from)
            const to_balance_sent = await ethers.provider.getBalance(to)
            console.log('after transfer from balance:%s to balance:%s', from_balance_sent, to_balance_sent)
            expect(from_balance).to.be.equal(from_balance_sent)
            expect(to_balance).to.be.equal(to_balance_sent)
        }
    }).timeout(15000)

    it("repeated nonce", async () => {
        const txHash = await ethers.provider.send("eth_sendTransaction", [{
            "from": from,
            "to": to,
            "gas": "0x76c000",
            "gasPrice": gasPrice,
            "value": "0x1"
        }])
        const txInfo = await ethers.provider.getTransaction(txHash)
        const nonce = await ethers.provider.getTransactionCount(txInfo.from)
        const from_balance = await ethers.provider.getBalance(from)
        const to_balance = await ethers.provider.getBalance(to)
        console.log('before transfer from balance:%s to balance:%s', from_balance, to_balance)
        try {
            await (await ethers.getSigners())[0].sendTransaction({
                "to": to,
                "value": "0x1",
                "nonce": nonce - 1
            })
        } catch (e) {
            expect(e.toString()).to.be.contains("invalid nonce")
        } finally {
            const from_balance_sent = await ethers.provider.getBalance(from)
            const to_balance_sent = await ethers.provider.getBalance(to)
            console.log('after transfer from balance:%s to balance:%s', from_balance_sent, to_balance_sent)
            expect(from_balance).to.be.equal(from_balance_sent)
            expect(to_balance).to.be.equal(to_balance_sent)
        }
    }).timeout(15000)
})


async function tranfer(from, to, value, data) {
    let tx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": "0x76c000",
        "gasPrice": gasPrice,
        "value": value,
        "data": data
    }])
    let response = await getTxReceipt(ethers.provider, tx, 100)
    expect(response.status).to.be.equal(1)
    return response
}

async function estGas(account0, account1, value, data) {
    return await ethers.provider.send("eth_estimateGas", [{
        "from": account0,
        "to": account1,
        "gas": "0x76c000",
        "gasPrice": gasPrice,
        "value": value,
        "data": data
    }])
}