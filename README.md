# Godwoken Tests

This repository contains integration tests that test [Godwoken](https://github.com/nervosnetwork/godwoken).

## Prerequisites

* [Rust](https://rustup.rs), [`Node.js` v14+](https://nodejs.org) and [`Yarn`](https://yarnpkg.com) are required.
* Before tests can be run locally, a godwoken dev chain should be runing.
[Godwoken-Kicker](https://github.com/RetricSu/godwoken-kicker) would be a good choice to start godwoken-polyjuice chain with one line command.
## Running tests locally

1. Update your godwoken configs into `configs/`, including `godwoken-config.toml`, `scripts-deploy-result.json` and `lumos-config.json`.

2. Build tools
```bash
chmod +x init.sh && ./init.sh # build tools for testing
```

3. `cp example.env .env` and then update environment variables in `.env` such as `CKB_RPC`, `GODWOKEN_RPC`, `GODWOKEN_API`, `WEB3_RPC`, USER`x`_PRIVATE_KEY, etc.

4. Run tests with your own environment variables.
```bash
source .env                   # use your own env file
RUST_LOG=info cargo run       # run all test cases
```

**Note**: If you boot a new godwoken chain, you should update the config files in `configs/` and run `./init.sh` again.

## Test cases

The test cases are managed in `src/specs/`, such as `scr/specs/ckb_asset.rs`.

Remember to add new specs into `all_specs()` function in `src/main.rs`.

You can run specified specs:

```bash
RUST_LOG=godwoken_tests=debug cargo run -- [CkbAsset] [SudtAsset] [Polyjuice] [OtherSpecStructName]
```

See all available options:

```bash
cargo run -- --help
# 
# godwoken-tests 0.1.0
#
# USAGE:
#     godwoken-tests [FLAGS] [OPTIONS] [specs]...
#
# FLAGS:
#     -h, --help         Prints help information
#         --no-report    [TODO]Do not show integration test report
#     -V, --version      Prints version information
#         --verbose      [TODO]Show verbose log
#
# OPTIONS:
#     -c, --concurrent <concurrent>    The number of specs can running concurrently [default: 1]
#         --log-file <log-file>        [TODO]Write log outputs into file.
#         --max-time <SECONDS>         Exit when total running time exceeds this limit

# ARGS:
#     <specs>... 
```
