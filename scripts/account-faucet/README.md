# Account-Faucet

## What is this?
This is Account-Faucet, a CLI tool to claim faucet for your Godwoken layer 2 accounts.

## Why should I use it?
Originally, when you need to claim faucet to your Godwoken layer 2 wallet, you need to go through all these steps:
1. Go to [Faucet](https://faucet.nervos.org) page and claim faucet to your CKB account
2. Go to [Godwoken Bridge](https://testnet.bridge.godwoken.io/) and deposit CKB to your Godwoken layer 2 account

The steps above are fairly simple, but not so easy if you do it manually, every day. 
With this CLI tool, you can actually finish the entire process in one command, which can save you a lot of time. 

All you need to prepare is your `ETH address`, or your `CKB private key`.

## Ready
1. Go to `Account-Faucet` folder in `Godwoken-Tests`:
```bash
$ cd scripts/account-faucet
```
2. Install dependencies:
```bash
$ npm install
```

## Claim faucet

### Claim with ETH Address
If you're more familiar with your `ETH address`, we recommend you to use this command: 
```bash
$ npm run faucet -- claim -e <ETH_ADDRESS>
```

### Claim with CKB Private Key
If you prefer to claim faucet with your `CKB Layer 1 Private Key`:
```bash
$ npm run faucet -- claim -p <CKB_PRIVATE_KEY>
```

### Other command options
For more options, you can check with the `--help` command:
```bash
$ npm run faucet -- claim -h
```

## Get Layer2 Deposit Address

### Calculate with ETH Address or CKB Private Key
This is an util command to calculate the Layer2 Deposit Address.   
It's a very similar command to the `claim` command, you can pass a ETH address:
```bash
$ npm run faucet -- get-l2-address -e <ETH_ADDRESS>
```
Or pass a CKB Private Key:
```bash
$ npm run faucet -- get-l2-address -p <CKB_PRIVATE_KEY>
```

### Address on different network
You can use `-n` or `--network` option to calculate the Layer2 Deposit Address on different network:
```bash
$ npm run faucet -- get-l2-address -e <ETH_ADDRESS> -n <NETWORK>
```

Right now the supported networks are:
- mainnet_v1
- testnet_v1