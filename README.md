# How to test your Solidity contracts on Godwoken v1

## Test on testnet

You can follow the command-lines below to install Godwoken-Tests in your local environment, and run contract tests on testnet_v1:

1. `git clone https://github.com/nervosnetwork/godwoken-tests` - Clone Godwoken-Tests
2. `cd godwoken-tests/contracts` - Go to contracts folder
3. `npm install` - Install dependencies
4. `npm run test:gw_testnet_v1` - Run tests on testnet_v1

## Deploy and test on devnet

If you wish to run tests on devnet instead of testnet, please read the current section.

First, you need to install [Godwoken-Kicker](https://github.com/godwokenrises/godwoken-kicker), and then deploy a local devnet_v1 running in the localhost network:

1. `git clonehttps://github.com/godwokenrises/godwoken-kicker` - Clone Godwoken-Kicker
2. `cd godwoken-kicker` - Go to kicker tool’s folder
3. `./kicker start` - Deploy and start a devnet_v1 in localhost network

The deployment will take some time to complete, and for more detailed about how to start devnet in your localhost network, please read this: [Deploy Local Network of Godwoken](https://github.com/godwokenrises/godwoken-kicker/blob/main/docs/kicker-start.md).

After the devnet started, you should deposit some testing capacity of testing accounts from layer 1 (CKB network) to layer 2 (Godwoken network):

```bash
./kicker deposit 0x966b30e576a4d6731996748b48dd67c94ef29067 10000
./kicker deposit 0x4fef21f1d42e0d23d72100aefe84d555781c31bb 10000
```

> NOTE: After the deposit commands have been completed, **please wait 15 seconds before moving forward**. Godwoken needs some time to consume and confirm deposit requests.
>

After deposited, you can follow command-lines below to install Godwoken-Tests in your local environment, and run contract tests on devnet_v1:

1. `git clone https://github.com/nervosnetwork/godwoken-tests` - Clone Godwoken-Tests
2. `cd godwoken-tests/contracts` - Go to contracts folder
3. `npm install` - Install dependencies
4. `npm run test` - Run tests on devnet_v1

## Use your preferred accounts in the tests

Testing accounts are defined in [contracts/hardhat.config.js](https://github.com/nervosnetwork/godwoken-tests/blob/develop/contracts/hardhat.config.js).

If you prefer using your own accounts for testing, you can replace them in the source code, or run test commands with environment variables, for example:

```bash
PRIVATE_KEY=<YOUR_KEY> npm run test
```