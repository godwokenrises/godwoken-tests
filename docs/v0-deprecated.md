# Godwoken Tests

This repository contains integration tests that test [Godwoken](https://github.com/nervosnetwork/godwoken). You can trigger a test workflow [here](https://github.com/nervosnetwork/godwoken-tests/actions/workflows/test.yml) or run tests locally.

## Key Env
In a Github workflow, the `GW_PREBUILDS_IMAGE` env will replace the `DOCKER_PREBUILD_IMAGE_NAME` env in `kicker/docker/.build.mode.env`. You could change this image as you like, such as `nervos/godwoken-prebuilds:latest`.
```YAML
# .github/workflows/test.yml

env:
  # Image built from https://github.com/Flouse/godwoken-docker-prebuilds/tree/develop
  GW_PREBUILDS_IMAGE_NAME: ghcr.io/flouse/godwoken-prebuilds
  GW_PREBUILD_IMAGE_TAG: develop
```

## Test cases in `test.yml`
```YAML
# .github/workflows/test.yml

- name: Testcase - Godwoken Polyjuice Compatibility Examples
    working-directory: testcases/godwoken-polyjuice-compatibility-examples
    run: |
    yarn install && yarn compile
    ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/multi-sign-wallet.ts
    ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/box-proxy.ts
    ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/multicall.ts
    ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/create2.ts
    ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/stable-swap-3-pool.ts
    timeout-minutes: 6

- name: Testcase - Pancakeswap
    working-directory: testcases/pancakeswap-contracts-godwoken
    run: |
    yarn && yarn compile
    ENV_PATH=../../tools/packages/tools/configs/devnet.env yarn ts-node ./scripts/deploy.ts
    timeout-minutes: 6

- name: Testcase - LendingContracts
    working-directory: testcases/lending-contracts
    run: |
    yarn
    echo "The configs should have been updated:"
    cat config.json
    yarn deploy
    timeout-minutes: 12
```
More cases could be added into `.github/workflows/test.yml`.


## How to create a godwoken integration-test workflow

#### Prerequisites
Admin rights(`actions:write` permission) to this repository is required.

### 2 Methods

* Use the `Run workflow` button on the Action tab to easily trigger a run

    <img src="https://user-images.githubusercontent.com/1297478/135286697-ae13f1af-40ae-4e97-9bc7-28799d6fd740.png " alt="run workflow" width="360"/>

    We can specify the inputs of a [workflow dispatch](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#workflow_dispatch):

      a. The prebuild image including Godwoken related bins (* required). Pick the right tag from:
        
       - https://hub.docker.com/r/nervos/godwoken-prebuilds
       - https://github.com/Flouse/godwoken-docker-prebuilds/pkgs/container/godwoken-prebuilds

      b. The special versions of Godwoken, Godwoken-scripts, or Polyjuice we want to test with (optional)

* Use the `dispatches` REST API endpoint to manually trigger a GitHub Action workflow run

    <code><span class="color-bg-info-inverse color-text-inverse rounded-1 px-2 py-1" style="text-transform: uppercase">post</span> /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches</code>

    See also: [GitHub Doc - Create a workflow dispatch event](https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event)

    Example:
    ```sh
    curl -u {username}:{$token} \
        -X POST \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/nervosnetwork/godwoken-tests/actions/workflows/test.yml/dispatches \
        -d '{"ref":"develop","inputs":{"gw_prebuild_image_name":"ghcr.io/flouse/godwoken-prebuilds","gw_prebuild_image_tag":"v0.6.5-rc3"}}'
    ```
    > Set up a variable for token to avoid leaving your token in shell history, which should be avoided.

## Running tests locally

### Prerequisites

* [Docker](https://docs.docker.com/get-docker/), [docker-compose](https://docs.docker.com/compose/install/), [`Node.js` v14+](https://nodejs.org) and [`Yarn`](https://yarnpkg.com) are required.
* Before tests can be run locally, a godwoken dev chain should be runing.
[Godwoken-Kicker](https://github.com/RetricSu/godwoken-kicker) would be a good choice to start godwoken-polyjuice chain with one line command.

### Steps

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

> **Note**: If you boot a new godwoken chain, you should `generate-envfile` again.
