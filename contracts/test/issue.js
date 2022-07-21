const {expect} = require("chai");
const {ethers} = require("hardhat");
const {BigNumber} = require("ethers");


describe('issue', function () {
    this.timeout(600000)
    describe("Revert did not return an error message(https://github.com/nervosnetwork/godwoken-web3/issues/293)(https://github.com/nervosnetwork/godwoken-web3/issues/423)", function () {

        it.skip("error RpcError: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced. RpcError: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, " +
            "requesting data from a block number that does not exist, or querying a node which is not fully synced.\n", async () => {

            let contractInfo = await ethers.getContractFactory("RevertError");
            let contract = await contractInfo.deploy()
            await contract.deployed()
            console.log("contract Address:", contract.address)
            try {
                await contract.testEmpty()
            } catch (e) {
                expect(e.data).to.be.include('0x3db2a12a')
                expect(e.errorName).to.be.equal('Empty')
                return
            }
            expect('').to.be.include('failed')
        })

        it.skip("overflow", async () => {
            //expected : execution reverted
            let contractInfo = await ethers.getContractFactory("RevertError");
            let contract = await contractInfo.deploy()
            await contract.deployed()
            await contract.addError(0);
            try {
                await contract.addError(1);
            } catch (e) {
                expect(e.toString()).to.be.contains("reverted with panic code 0x11")
                expect(e.errorName).to.be.include('Panic')
                expect(e.errorArgs[0]).to.be.equal('0x11')
                return
            }
            expect('').to.be.include('failed')
        })

    })

    it.skip("revert msg(https://github.com/nervosnetwork/godwoken-web3/issues/423)", async () => {
        let contractInfo = await ethers.getContractFactory("RevertError");
        let contract = await contractInfo.deploy();
        await contract.deployed();

        let msg = "revertMsg";

        try {
            // invoke method that contains revert
            await contract.revertMsg(msg);
            expect("").to.be.equal("failed")
        } catch (e) {
            console.log(e)
            console.log('e:string:', e.toString())
            expect(e.errorName).to.be.equal('Error')
            expect(e.args[0]).to.be.include('ssssssssssssssssssssssssssssss')
        }

    })

    it("send tx use estimate gas ,should no out of gas tx (https://github.com/nervosnetwork/godwoken-web3/issues/301)", async () => {

        let contractInfo = await ethers.getContractFactory("issue301");
        // 1. deploy BugProxyTest contract
        let contract = await contractInfo.deploy();
        await contract.deployed();

        // 2. invoke BugProxyTest.TestProxy()
        let tx = await contract.TestProxy();
        await tx.wait()

        // 3. proxyAddress = BugProxyTest.proxy()
        let proxyAddress = await contract.proxy();
        let Implementation2ContractInfo = await ethers.getContractFactory("Implementation2");
        let account = await ethers.getSigners();

        // 4. invoke Implementation2(proxyAddress).getValue()
        let Implementation2ContractProxy = Implementation2ContractInfo.connect(account[0]).attach(proxyAddress);

        // 5. invoke Implementation2(proxyAddress).setValue(433)
        tx = await Implementation2ContractProxy.setValue(433);
        await tx.wait()
        let getValue = await Implementation2ContractProxy.getValue();

        expect(getValue.toString()).to.be.equal("433");
    })


    describe('newFilter', function () {

        it.skip("invoke eth_getFilterChanges 2 times, second logs length must be 0 ", async () => {
            const filterId = await ethers.provider.send("eth_newFilter", [{}]);

            await sendTxToAddBlockNum(3)
            let logs = await ethers.provider.send("eth_getFilterChanges", [filterId]);
            checkLogsIsSort(logs)
            logs = await ethers.provider.send("eth_getFilterChanges", [filterId]);
            expect(logs.toString()).to.be.equal('')
        })

        describe('filter', function () {

            let blockHeight
            let filterMsg;
            before(async function () {
                blockHeight = await ethers.provider.getBlockNumber()

                filterMsg = await getFilterMsgByFilter(
                    {

                        "fromBlock.pending": {
                            'fromBlock': 'pending'
                        },
                        "fromBlock.blockHeight+1000": {
                            'fromBlock': BigNumber.from(blockHeight).add(1000).toHexString().replace('0x0', '0x')
                        },

                        "toBlock.earliest": {
                            "toBlock": "earliest"
                        },
                    }, 3)
            });


            describe("fromBlock", function () {


                it.skip("pending,should return error msg", async () => {
                    //invalid from and to block combination: from > to
                    expect(filterMsg["fromBlock.pending"].error).to.be.not.equal(undefined)

                })


                it.skip("blockNumber(blockHeight+1000),should return 0 log", async () => {

                    expect(filterMsg["fromBlock.blockHeight+1000"].logs.length).to.be.equal(0)
                })

            })

            describe('toBlock', function () {

                it.skip("earliest,should return error msg", async () => {
                    //invalid from and to block combination: from > to
                    expect(filterMsg["toBlock.earliest"].error).to.be.not.equal(undefined)
                })

            });

            describe('topic', function () {

                let contractAddress;

                let topic0 = "0x0000000000000000000000000000000000000000000000000000000000000001";
                let topic1 = "0x0000000000000000000000000000000000000000000000000000000000000002";
                let topic2 = "0x0000000000000000000000000000000000000000000000000000000000000003";
                let topic3 = "0x0000000000000000000000000000000000000000000000000000000000000004";
                let filterMsgMap;
                let logContract;
                let blockHeight;

                before(async function () {

                    blockHeight = await ethers.provider.getBlockNumber()
                    //deploy contract
                    let logContractInfo = await ethers.getContractFactory("logContract");
                    logContract = await logContractInfo.deploy()
                    await logContract.deployed()
                    contractAddress = logContract.address
                    let topicsMap = {

                        "topic.[[A, B],[A, B]].yes": {
                            "topics": [[topic3, topic0], [null, null, topic2]]
                        },
                        "topic.[[A, B],[A, B]].no": {
                            "topics": [[topic0, topic2, topic3], [null, topic2], [topic1]]
                        },
                    }

                    filterMsgMap = await getTopicFilter(topicsMap, logContract, 10)
                })

                it.skip("[[A, B], [A, B]].yes", async () => {
                    //check get filed id success
                    expect(filterMsgMap["topic.[[A, B],[A, B]].yes"].error).to.be.equal(undefined)
                    expect(filterMsgMap["topic.[[A, B],[A, B]].yes"].logs.length).to.be.not.equal(0)
                    await checkLogsGteHeight(filterMsgMap["topic.[[A, B],[A, B]].yes"].logs, blockHeight)
                    await checkLogsIsSort(filterMsgMap["topic.[[A, B],[A, B]].yes"].logs)
                })

                it.skip("[[A, B], [A, B]].no", async () => {
                    expect(filterMsgMap["topic.[[A, B],[A, B]].no"].error).to.be.equal(undefined)
                    expect(filterMsgMap["topic.[[A, B],[A, B]].no"].logs.length).to.be.equal(0)
                })

            });


        });

    });


});


/**
 * 1. filter
 * 2. send tx
 * 3. get filter change log msg
 * @param topicFilterMap
 * @param logContract
 * @param sendCount
 * @returns filterMsgMap: filter change log msg
 */
async function getTopicFilter(topicFilterMap, logContract, sendCount) {

    let filterMsgMap = {}

    // register filter Id
    for (const key in topicFilterMap) {
        filterMsgMap[key] = {}
        try {
            filterMsgMap[key].filterId = await ethers.provider.send("eth_newFilter", [topicFilterMap[key]])
        } catch (e) {
            filterMsgMap[key].error = e
        }
    }

    // invoke contract
    let nonce = await ethers.provider.getTransactionCount(logContract.signer.address, "latest")
    let txList = []
    for (let i = 0; i < sendCount; i++) {
        let tx = await logContract.testLog4(500, {nonce: nonce})
        await sleep(500)
        nonce++
        txList.push(tx)
    }

    for (let i = 0; i < txList.length; i++) {
        await txList[i].wait(1)
    }

    // get filter result

    for (const key in filterMsgMap) {
        if (filterMsgMap[key].filterId === undefined) {
            continue
        }
        try {
            filterMsgMap[key].logs = await ethers.provider.send("eth_getFilterChanges", [filterMsgMap[key].filterId])
        } catch (e) {
            filterMsgMap[key].error = e
        }
    }

    return filterMsgMap

}

/**
 * 1. filter
 * 2. send tx
 * 3. get filter change log
 * @param filterMap
 * @param sendBlkNum
 * @returns FilterMsg:  filter change log
 */
async function getFilterMsgByFilter(filterMap, sendBlkNum) {
    let FilterMsg = {}
    for (let key in filterMap) {
        FilterMsg[key] = {}
        try {
            FilterMsg[key].filterMap = filterMap
            FilterMsg[key].filterId = await ethers.provider.send("eth_newFilter", [filterMap[key]])
        } catch (e) {
            FilterMsg[key].error = e
        }
    }
    await sendTxToAddBlockNum(sendBlkNum)
    for (let key in FilterMsg) {
        try {
            if (FilterMsg[key].filterId === undefined) {
                continue
            }
            FilterMsg[key].logs = await ethers.provider.send("eth_getFilterChanges", [FilterMsg[key].filterId])
        } catch (e) {
            FilterMsg[key].error = e
        }
    }
    return FilterMsg
}


/**
 * add block height use send tx
 * @param blockNumber add block length
 * @returns {Promise<void>}
 */
async function sendTxToAddBlockNum(blockNumber) {
    let endNumber = await ethers.provider.getBlockNumber() + blockNumber;
    let currentNumber = await ethers.provider.getBlockNumber();
    while (currentNumber < endNumber) {
        await sendTxContainsLog()
        currentNumber = await ethers.provider.getBlockNumber();
    }
}

/**
 * use the second account send tx
 * @returns {Promise<void>}
 */
async function sendTxContainsLog() {
    let from = (await ethers.getSigners())[1].address
    let logContract = await ethers.getContractFactory("logContract");
    try {
        await ethers.provider.send("eth_sendTransaction", [{
            "from": from,
            "data": logContract.bytecode
        }]);
    } catch (e) {
    }
}

/**
 * check log is sort
 * @param logs
 */
function checkLogsIsSort(logs) {
    let latestLog = "0x0";
    for (let i = 0; i < logs.length; i++) {
        let currentSore = getScoreByLog(logs[i])
        // console.log("blockNumber:", BigNumber.from(logs[i].blockNumber.toString()).toString(), "blkIdx:", logs[i].transactionIndex, "logIndex:", logs[i].logIndex," score:",currentSore)
        expect(currentSore).to.be.gt(latestLog)
        latestLog = currentSore
    }
}

async function checkLogsGteHeight(logs, blockHeight) {
    for (const log of logs) {
        expect(BigNumber.from(log.blockNumber)).to.be.gte(blockHeight)
    }
}

/**
 * get score by log
 * @param log tx log
 * @returns score (blockNum) * base**2 + (transactionIndex) * base +  logIndex
 */
function getScoreByLog(log) {
    const base = 100000;
    let nowBlkNum = BigNumber.from(log.blockNumber);
    let nowBlkIdx = BigNumber.from(log.transactionIndex);
    let nowLogIdx = BigNumber.from(log.logIndex);
    return nowBlkNum.mul(base * base).add(nowBlkIdx.mul(base)).add(nowLogIdx)
}


async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
