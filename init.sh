# start your godwoken dev chain, and then update your godwoken configs into `configs`
export SCRIPT_DEPLOY_RESULT_PATH=${PWD}/configs/scripts-deploy-result.json
export GODWOKEN_CONFIG_PATH=${PWD}/configs/godwoken-config.toml

# If you switched to a new CKB chain,
# you should switch to a new indexer path `--indexer-path <your new path>`,
# or just delete `indexer-data` dir.
[[ -n "$KEEP_INDEXER" ]] || rm -r indexer-data

# use godwoken-examples submodule as tools
git submodule update --init --recursive --depth=1

cd tools
yarn                # please use node@14
yarn build-tools
yarn copy-configs   # copy and convert config format
yarn build-all

# setup light-godwoken-cli
cd ../scripts/light-godwoken-cli
./init.sh
