# Script to initialize Light-Godwoken-CLI

cd ../..
git submodule update --init --recursive --depth=1

cd light-godwoken
yarn && yarn run build --scope=light-godwoken

cd ../scripts/light-godwoken-cli
npm i && npm run build
