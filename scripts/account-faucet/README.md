# Account-Faucet

## What is this?
Originally, when you're claiming faucet for your Godwoken layer 2 account, you need to go through the following steps:
1. Go to [Faucet](https://faucet.nervos.org) page and claim faucet to your CKB account
2. Go to [Godwoken Bridge](https://testnet.bridge.godwoken.io/) and deposit CKB to your Godwoken layer 2 account

With this CLI tool, you can actually finish the entire process in one command, which should save you a lot of time. And this is Account-Faucet, a CLI tool to claim faucet for your Godwoken layer 2 accounts.

## Setup environment
Go to `Account-Faucet` folder in `Godwoken-Tests` and set up the tool:
```bash
# Position: godwoken-tests/
$ cd scripts/account-faucet
$ npm install && npm run build
```

## Claim faucet for layer 2
If you want to claim faucet directly to your layer 2 account, you can try the `claim-l2` command.  
The `claim-l2` command calculates your layer 2 address, then automatically claim faucet to it, so you don't waste extra fee or time doing them all manually.

### Claim with ETH Address (Recommended) or with Private Key
You can use `-e` or `--eth-address` to claim faucet for layer 2: 
```bash
$ account-faucet claim-l2 --eth-address <ETH_ADDRESS>
```
Or if you only have a privateKey on hand, you can use `-p` or `--private-key` to claim faucet for layer 2:
```bash
$ account-faucet claim-l2 --private-key <PRIVATE_KEY>
```

### Claim on different networks
You can use `-n` or `--network` option to claim faucet on different network:
```bash
$ account-faucet claim-l2 --private-key <PRIVATE_KEY> --network <NETWORK>
```
Right now the tool supports these networks:
- testnet_v1
- alphanet_v1

## Claim faucet for layer1
If you only want to claim faucet to your L1 account instead of layer 2 account, you can try the `claim-l1` command.  
The `claim-l1` command takes either `--private-key` or `--ckb-address` as param, and will automatically claim faucet to your L1 account, so you don't need to do it by yourself.

### Claim with Private Key or CKB Address
You can use `-p` or `--private-key` to claim faucet for L1:
```bash
$ account-faucet claim-l1 -p <PRIVATE_KEY>
```
Or you can use `-c` or `--ckb-address` to claim faucet for L1:
```bash
$ account-faucet claim-l1 -c <CKB_ADDRESS>
```

### Claim on different networks
You can use `-n` or `--network` option to claim faucet on different network:
```bash
$ account-faucet claim-l1 --private-key <PRIVATE_KEY> --network <NETWORK>
```

## Get Layer2 Deposit Address

### Calculate with ETH Address or CKB Private Key
This is an util command to calculate the Layer2 Deposit Address.   
It's a very similar command to the `claim` command, you can pass a ETH address (`-e` or `--eth-address`):
```bash
$ account-faucet get-l2-address --eth-address <ETH_ADDRESS>
```
Or pass a CKB Private Key (`-p` or `--private-key`):
```bash
$ account-faucet get-l2-address --private-key <PRIVATE_KEY>
```

### Address on different networks
You can use `-n` or `--network` option to calculate the Layer2 Deposit Address on different network:
```bash
$ account-faucet get-l2-address --eth-address <ETH_ADDRESS> --network <NETWORK>
```
