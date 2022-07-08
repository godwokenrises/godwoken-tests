# Account-Faucet

## What is it?
Account-Faucet is a CLI tool to help you claim faucet to your Godwoken layer 2 accounts.

You can pass a CKB private key, the CLI will automatically calculate the layer 2 deposit address, and then claim faucet to the address. Or you can pass `CKB address` and `ETH address` pair, the CLI will do the same thing for you.

## Usage
Install dependencies
```bash
$ npm install
```
Claim faucet, using your `CKB Layer 1 Private Key`
```bash
$ npm run faucet -- -p <CKB_PRIVATE_KEY>
```
Claim faucet, using your `ETH Address`
```bash
$ npm run faucet -- -e <ETH_ADDRESS>
```
When Claiming with `ETH Address`, you can also pass your `CKB Address`
```bash
$ npm run faucet -- -e <ETH_ADDRESS> - c <CKB_ADDRESS>
```
For more options, you can check for help
```bash
$ npm run faucet -- -h
```