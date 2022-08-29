# Light-Godwoken CLI

A CLI tool to interact with LightGodwoken.

## Installation

### Quick setup
```shell
# position: godwoken-tests/scripts/light-godwoken-cli
$ ./init.sh
```

### Setup manually
You can set up the module manually by following the steps below, if you failed to run the `Quick setup` command.

If you had run `Quick setup` command and succeed, then you don't need to do this manually.

**1. Setup git submodules**
```shell
# position: godwoken-tests/
$ git submodule update --init --recursive --depth=1
```

**2. Setup light-godwoken:**
```shell
# position: godwoken-tests/light-godwoken
$ yarn && yarn lerna run build --scope=light-godwoken 
```

**3. Setup light-godwoken-cli:**
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

### Withdraw
Withdraw capacity from Godwoken layer2 to CKB layer1:
```shell
# position: godwoken-tests/scripts/light-godwoken-cli/
$ lgc withdraw -p <PRIVATE_KEY> -c <WITHDRAW_CAPACITY> -n <NETWORK>
```

### Get balance
Get layer1 and layer2 balance of an account:
```shell
# position: godwoken-tests/scripts/light-godwoken-cli/
$ lgc get-balance <PRIVATE_KEY> -n <NETWORK>
```
