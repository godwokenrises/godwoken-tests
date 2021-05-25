# Godwoken Tests

This repository contains integration tests that test [Godwoken](https://github.com/nervosnetwork/godwoken).

## Running tests locally
Before tests can be run locally, a godwoken dev chain should be runing.
Please update your godwoken configs into `configs/`, including `godwoken-config.toml`, `scripts-deploy-result.json` and `lumos-config.json`.

```bash
chmod +x init.sh && ./init.sh # build tools for testing
source <example.env>          # use your own env file containing RPC URLs and private keys etc.
cargo run                     # run all test cases
```
Note: If you boot a new godwoken chain, you should update the config files and run `./init.sh` again.

### Test cases

The test cases are managed in `src/specs/`, such as `scr/specs/ckb_asset.rs`.

Remember to add new specs into `all_specs()` function in `src/main.rs`.

You can run specified specs:

```bash
cargo run -- [CkbAsset] [SudtAsset] [OtherSpecSturctName]
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
