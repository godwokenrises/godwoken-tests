const fetch = require('../tools/node_modules/node-fetch/lib');

/**
 * eth_getTipNumber
 * cmd:
 * curl <web3RPC> -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params": [],"id":2}'
 * 
 * @param {String} web3RPC eg. Web3RPC of Godwoken testnet: http://godwoken-testnet-web3-rpc.ckbapp.dev
 * @returns {Number} tipBlockNumber
 */
module.exports = async function getTipBlockNumber(web3RPC) {
  const rawResponse = await fetch(web3RPC || "http://localhost:8024", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{"jsonrpc":"2.0","method":"eth_blockNumber","params": [],"id":2}'
  });
  const content = await rawResponse.json();
  // console.log(content);

  const tipBlockNumber = Number(content.result);
  console.log("tipBlockNumber =", tipBlockNumber);

  return tipBlockNumber;
}