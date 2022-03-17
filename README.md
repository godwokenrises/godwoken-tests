# How to test your Solidity contracts on Godwoken v1

You can deploy in the localhost network following these steps:

1. Start Godwoken devnet_v1 through [Godwoken-Kicker](https://github.com/RetricSu/godwoken-kicker/tree/compatibility-changes)

```sh
git clone -b compatibility-changes https://github.com/RetricSu/godwoken-kicker
cd godwoken-kicker 
./kicker start
```

2. Deposit some testing capacity of testing accounts from layer1(CKB network) to layer2(Godwoken network). These accounts are defined in [`contracts/hardhat.config.js`](https://github.com/nervosnetwork/godwoken-tests/blob/develop/contracts/hardhat.config.js)

```sh
# cd godwoken-kicker
./kicker deposit 0x966b30e576a4d6731996748b48dd67c94ef29067 10000
./kicker deposit 0x4fef21f1d42e0d23d72100aefe84d555781c31bb 10000
```

NOTE: After the deposit commands have been completed, **please wait 15 seconds before moving forward**. Godwoken needs some time to consume and confirm deposit requests.

3. Run godwoken-tests cases using [Hardhat](https://hardhat.org)

```sh
git clone https://github.com/nervosnetwork/godwoken-tests
cd godwoken-tests
cd contracts
npm install
npm run test
```

As general rule, you can target any network configured in the hardhat.config.js
```sh
npx hardhat run --network <your-network> scripts/deploy.js
```
