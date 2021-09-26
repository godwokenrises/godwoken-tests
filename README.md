# Godwoken Tests

This repository contains integration tests that test [Godwoken](https://github.com/nervosnetwork/godwoken).

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/), [docker-compose](https://docs.docker.com/compose/install/), [`Node.js` v14+](https://nodejs.org) and [`Yarn`](https://yarnpkg.com) are required.
* Before tests can be run locally, a godwoken dev chain should be runing.
[Godwoken-Kicker](https://github.com/RetricSu/godwoken-kicker) would be a good choice to start godwoken-polyjuice chain with one line command.

## Running tests locally

1. Fetch the source code:
```sh
git clone --recursive https://github.com/nervosnetwork/godwoken-tests.git
cd godwoken-tests
```

2. Update [`nervos/godwoken-prebuilds`](https://hub.docker.com/r/nervos/godwoken-prebuilds/tags?page=1&ordering=last_updated) docker image to the version you expected.
```sh
# edit this line in `kicker/docker/.build.mode.env`
DOCKER_PREBUILD_IMAGE_TAG=<the tag you expected>
```

3. Start Godwoken-Kicker
```sh
cd kicker
make init && make start
```

4. Generate a devnet envfile from [godwoken-config.toml](kicker/workspace/config.toml)
```sh
cd tools
yarn install
cd packages/tools
yarn generate-envfile
```

5. Run test cases using `devnet.env`
```sh
cd testcases/godwoken-polyjuice-compatibility-examples
yarn install && yarn compile
ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/box-proxy.ts
ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/multi-sign-wallet.ts
ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/multicall.ts
ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/create2.ts
ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/stable-swap-3-pool.ts

cd testcases/pancakeswap-contracts-godwoken
yarn && yarn compile
ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/deploy.ts
```

New test cases could be added into `testcases` directory

**Note**: If you boot a new godwoken chain, you should `generate-envfile` again.
