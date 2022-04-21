'use strict';
import { GodwokenClient } from "./godwoken";
import { Reader } from "ckb-js-toolkit";
import pkg from '@ckb-lumos/base';
const { utils } = pkg;
import keccak256 from "keccak256";
import crypto from "crypto";
import secp256k1 from 'secp256k1';
const { ecdsaSign } = secp256k1;
import {
	SerializeMetaContractArgs,
	SerializeRawL2Transaction,
	SerializeL2Transaction,
	SerializeETHAddrRegArgs,
} from "./godwoken-schema";


function normalizeHexNumber(length, value) {
	if (!(value instanceof ArrayBuffer)) {
		let intValue = BigInt(value).toString(16);
		if (intValue.length % 2 !== 0) {
			intValue = "0" + intValue;
		}
		if (intValue.length / 2 > length) {
			throw new Error(
				`${intValue.length / 2} bytes long, expected length is ${length}!`
			);
		}
		const view = new DataView(new ArrayBuffer(length));
		for (let i = 0; i < intValue.length / 2; i++) {
			const start = intValue.length - (i + 1) * 2;
			view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
		}
		value = view.buffer;
	}
	if (value.byteLength < length) {
		const array = new Uint8Array(length);
		array.set(new Uint8Array(value), 0);
		value = array.buffer;
	}
	return value;
}

function privateKeyToEthAddress(privateKey) {
	const ecdh = crypto.createECDH(`secp256k1`);
	ecdh.generateKeys();
	ecdh.setPrivateKey(Buffer.from(privateKey.slice(2), "hex"));
	const publicKey = "0x" + ecdh.getPublicKey("hex", "uncompressed");
	const ethAddress =
		"0x" +
		keccak256(Buffer.from(publicKey.slice(4), "hex"))
			.slice(12)
			.toString("hex");
	return ethAddress;
}
async function privateKeyToLayer2ScriptHash(
	privateKey,
	ethAccountTypeHash,
	rollupTypeHash
) {
	const ethAddress = privateKeyToEthAddress(privateKey);
	console.log(`ethAddress: ${ethAddress}`);
	return ethAddrToScriptHash(ethAccountTypeHash, rollupTypeHash, ethAddress);
}

function ethAddrToScriptHash(
	ethAccountTypeHash,
	rollupTypeHash,
	ethAddress) {
	const script = {
		code_hash: ethAccountTypeHash,
		hash_type: "type",
		args: rollupTypeHash + ethAddress.slice(2),
	};

	const scriptHash = utils.computeScriptHash(script);
	return scriptHash;

}

function normalizeRawL2Tx(rawL2Tx) {
	const tx = {
		from_id: normalizeHexNumber(4, rawL2Tx.from_id),
		to_id: normalizeHexNumber(4, rawL2Tx.to_id),
		nonce: normalizeHexNumber(4, rawL2Tx.nonce),
		args: new Reader(rawL2Tx.args)
	};
	return tx;

}
function serializeRawL2Tx(rawL2Tx) {
	const tx = normalizeRawL2Tx(rawL2Tx);
	return new Reader(SerializeRawL2Transaction(tx)).serializeJson();
}

function serializeL2Tx(l2tx) {
	const tx = {
		raw: normalizeRawL2Tx(l2tx.raw),
		signature: new Reader(l2tx.signature)
	};
	return new Reader(
		SerializeL2Transaction(tx)
	).serializeJson();
}

async function privateKeyToAccountId(
	godwokenClient,
	privateKey,
	ethAccountTypeHash,
	rollupTypeHash
) {
	const scriptHash = await privateKeyToLayer2ScriptHash(
		privateKey,
		ethAccountTypeHash,
		rollupTypeHash
	);
	const id = await godwokenClient.getAccountIdByScriptHash(scriptHash);
	return id;
}

function createMetaContractArgs(rollupTypeHash, ethAccountTypeHash, ethAddr) {
	console.log(`rollup type hash: ${rollupTypeHash}`);
	console.log(`eth account type hash: ${ethAccountTypeHash}`);
	console.log(`eth addr: ${ethAddr}`);
	const scriptArgs = rollupTypeHash + ethAddr.slice(2).toLowerCase();
	console.log(`script args: ${scriptArgs}`);
	const l2Script = {
		code_hash: new Reader(ethAccountTypeHash),
		hash_type: 1, //Type
		args: new Reader(scriptArgs),
	};
	const fee = "0x64";
	const createAccount = {
		script: l2Script,
		fee: normalizeHexNumber(8, fee)
	};

	// MetaContractArgs
	const metaContractArgs = {
		type: "CreateAccount",
		value: createAccount
	};

	return new Reader(SerializeMetaContractArgs(metaContractArgs)).serializeJson();
}

function generateTxMessage(rawL2Tx, rollupTypeHash, senderScriptHash, receiverScriptHash) {
	const rawTxHex = serializeRawL2Tx(rawL2Tx);
	const data =
		rollupTypeHash +
		senderScriptHash.slice(2) +
		receiverScriptHash.slice(2) +
		rawTxHex.slice(2);
	const message = new utils.CKBHasher().update(data).digestHex();
	const prefix = Buffer.from(`\x19Ethereum Signed Message:\n32`);
	const buf = Buffer.concat([prefix, Buffer.from(message.slice(2), "hex")]);
	return `0x${keccak256(buf).toString("hex")}`;
}

function signMessage(message, privateKey) {
	const signObject = ecdsaSign(
		new Uint8Array(new Reader(message).toArrayBuffer()),
		new Uint8Array(new Reader(privateKey).toArrayBuffer())
	);
	const signatureBuffer = new ArrayBuffer(65);
	const signatureArray = new Uint8Array(signatureBuffer);
	signatureArray.set(signObject.signature, 0);
	let v = signObject.recid;
	if (v >= 27) {
		v -= 27;
	}
	signatureArray.set([v], 64);

	const signature = new Reader(signatureBuffer).serializeJson();
	return signature;
}

async function createEoaAccount(rpc, privateKey, ethAddr, ethAddrRegTypeHash) {
	//1. create EOA account for ethAddr
	const rollupTypeHash = await rpc.getRollupTyeHash();
	const ethAccountTypeHash = await rpc.getEthAccountTypeHash();
	const fromId = await privateKeyToAccountId(rpc, privateKey, ethAccountTypeHash, rollupTypeHash);
	console.log(`fromId: ${fromId}`);
	let nonce = await rpc.getNonce(fromId);
	//0x0 is reserved for meta contract
	const metaContractAccountId = "0x0";

	const args = createMetaContractArgs(rollupTypeHash, ethAccountTypeHash, ethAddr);
	console.log(`createMetaContractArgs: ${args}`);
	//The structure of tx means: we want to create a tx that creating 
	//an EOA account(which type hash is ethAccountTypeHash) with Meta Contract.
	const createEOATx = await buildTx(rpc, privateKey, fromId, metaContractAccountId, nonce, args, rollupTypeHash);
	const l2TxHash = await rpc.submitL2Tx(createEOATx);
	console.log(`l2txHash: ${l2TxHash}`);
	//We expect to receive a receipt of the tx.
	//Attention! If the ethAddr has been created before, then we may not be able to receive a receipt.
	let receipt = await waitReceipt(rpc, l2TxHash);
	console.log(`receipt: ${JSON.stringify(receipt, null, 2)}`);

	//Check the EOA account we just created.
	let newScriptHash = ethAddrToScriptHash(ethAccountTypeHash, rollupTypeHash, ethAddr);
	const newAccountId = await rpc.getAccountIdByScriptHash(newScriptHash);
	console.log(`newAccountId: ${newAccountId}`);

	//2. Set mapping between ethAddr and godwoken script hash with Eth Addr Registry contract.
	nonce = await rpc.getNonce(fromId);
	const ethAddrRegScriptHash = buildEthAddrRegScriptHash(rollupTypeHash, ethAddrRegTypeHash);
	const ethRegMapArgs = buildEthRegMapArgs(newScriptHash);
	const ethRegAccountId = await rpc.getAccountIdByScriptHash(ethAddrRegScriptHash);
	console.log(`ethRegAccountId: ${ethRegAccountId}`);
	const l2Tx = await buildTx(rpc, privateKey, fromId, ethRegAccountId, nonce, ethRegMapArgs, rollupTypeHash);
	receipt = await rpc.executeL2Tx(l2Tx);
	console.log(`l2TxHash1: ${JSON.stringify(receipt, null, 2)}`);
}


function buildEthAddrRegScriptHash(rollupTypeHash, ethAddrRegTypeHash) {
	const script = {
		code_hash: ethAddrRegTypeHash,
		hash_type: "type",
		args: rollupTypeHash,
	};

	const scriptHash = utils.computeScriptHash(script);
	return scriptHash;

}
function buildEthRegMapArgs(accountScriptHash) {
	const fee = "0x0";
	const setMapping = {
		"gw_script_hash": new Reader(accountScriptHash),
		"fee": normalizeHexNumber(8, fee)
	};
	const ethRegArgs = {
		"type": "SetMapping",
		"value": setMapping
	};
	return new Reader(SerializeETHAddrRegArgs(ethRegArgs)).serializeJson();
}

async function buildTx(rpc, privateKey, fromId, toId, nonce, args, rollupTypeHash) {
	const rawL2Tx = {
		from_id: fromId,
		to_id: toId,
		nonce: nonce,
		args: args
	};
	const senderScriptHash = await rpc.getScriptHashByAccountId(fromId);
	const receiverScriptHash = await rpc.getScriptHashByAccountId(toId);
	const msg = generateTxMessage(rawL2Tx, rollupTypeHash, senderScriptHash, receiverScriptHash);
	const signature = signMessage(msg, privateKey);
	console.log(`signature: ${signature}`);
	const l2tx1 = {
		raw: rawL2Tx,
		signature: signature
	};
	console.log("l2 tx:", JSON.stringify(l2tx1, null, 2));
	return serializeL2Tx(l2tx1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitReceipt(rpc, txHash) {
	while (true) {
		await sleep(1000);
		let receipt = await rpc.getTransactionReceipt(txHash);
		if (receipt === null) {
			continue;
		}
		return receipt;
	}

}

async function main() {
	let rpc = new GodwokenClient("http://localhost:8024");
	//This private key is used in kicker.
	const privateKey = "0x94e1e988e705024cb8e02be5af2d28ce5aa747cad4e1fc33db41e923fbd03365";
	//The type hash of eth addr reg can be find in godwoken.toml in godwoken-kicker
	const ethAddrRegTypeHash = "0x29b04130447ac17d0361dd7bf82661fe261ebbf9a30620c10621581e6396f3c4";
	//The EOA account we are going to create.
	const ethAddr = "0xD1BBB255403C5dc6F6e44375fCF367131785aef6";
	await createEoaAccount(rpc, privateKey, ethAddr, ethAddrRegTypeHash);
}

main();