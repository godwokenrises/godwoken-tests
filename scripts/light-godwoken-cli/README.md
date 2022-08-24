# Light-Godwoken CLI

A CLI tool to interact with LightGodwoken.

## Installation

### Setup light-godwoken submodule
```shell
# position: godwoken-tests/
$ git submodule update --init --recursive --depth=1
$ cd light-godwoken
$ yarn && yarn lerna run build --scope=light-godwoken 
```

### Setup light-godwoken-cli
```shell
# position: godwoken-tests/
$ cd scripts/light-godwoken-cli
$ npm i && npm run build
```

## Usage

### Deposit
Deposit capacity from CKB layer1 to Godwoken layer2:
```shell
# position: godwoken-tests/scripts/light-godwoken-cli/
$ lgc deposit -p <PRIVATE_KEY> -c <DEPOSIT_CAPACITY> -n <NETWORK>
```

### Withdrawal
Withdraw capacity from Godwoken layer2 to CKB layer1:
```shell
# position: godwoken-tests/scripts/light-godwoken-cli/
$ lgc withdraw -p <PRIVATE_KEY> -c <DEPOSIT_CAPACITY> -n <NETWORK>
```
