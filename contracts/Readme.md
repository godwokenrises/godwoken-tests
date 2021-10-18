

## Deploying your contracts
You can deploy in the localhost network following these steps:

1. Start a local node

```sh
npx hardhat node
```

2. Open a new terminal and deploy the smart contract in the localhost network
```sh
npx hardhat run --network localhost scripts/deploy.js
```

As general rule, you can target any network configured in the hardhat.config.js
```sh
npx hardhat run --network <your-network> scripts/deploy.js
```