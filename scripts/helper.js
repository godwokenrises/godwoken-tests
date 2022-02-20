const fetch = require('../tools/node_modules/node-fetch/lib');

/**
 * eth_getTipNumber
 * cmd:
 * curl <web3RPC> -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params": [],"id":2}'
 * 
 * @param {String} web3RPC eg. Web3RPC of Godwoken testnet: http://godwoken-testnet-web3-rpc.ckbapp.dev
 * @returns {Number} tipBlockNumber
 */
async function getTipBlockNumber(web3RPC) {
  const rawResponse = await fetch(web3RPC || "http://localhost:8024", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{"jsonrpc":"2.0","method":"eth_blockNumber","params": [],"id":2}'
  });
  const content = await rawResponse.json();

  const tipBlockNumber = Number(content.result);
  console.log("tipBlockNumber =", tipBlockNumber);

  return tipBlockNumber;
}

const asyncSleep = (ms = 0) => {
  return new Promise((r) => setTimeout(r, ms));
};

/**
 * wait `l2BlocksNum` layer2 block2 passed
 * @param {Number} l2BlocksNum
 * @param {Number} startBlockNum
 */
async function waitXl2BlocksPassed(l2BlocksNum = 1, start = undefined) {
  const startBlockNum = start || await getTipBlockNumber();
  const endBlockNum = startBlockNum + l2BlocksNum;

  while (await getTipBlockNumber() < endBlockNum) {
    console.log(`Wait until L2Block#${endBlockNum} produced...`);
    await asyncSleep(20000);
  }
}

module.exports = { getTipBlockNumber, waitXl2BlocksPassed };