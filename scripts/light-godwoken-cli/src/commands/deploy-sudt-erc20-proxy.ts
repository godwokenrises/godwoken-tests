import ERC20 from '../contracts/ERC20.json';
import { readFile } from 'fs/promises';
import { ContractFactory} from 'ethers';
import { Command, Option } from 'commander';
import { HexString } from '@ckb-lumos/base';
import { Network, networks } from '../config';
import { mustBeInteger, addHexPrefix } from '../utils/format';
import { getL2SudtAccountId } from '../utils/godwoken/l2-sudt-id';
import { createLightGodwokenByNetworkConfig } from '../utils/client';
import { absolutePath } from '../utils/file';

export default function setupDeploySudtErc20Proxy(program: Command) {
  program
    .command('deploy-sudt-erc20-proxy')
    .description('Deploy L2 sUDT-ERC20-Proxy contract')
    .requiredOption('-p, --private-key <HEX_STRING>', 'account private key')
    .requiredOption('--sudt-lock-args <HEX_STRING>', 'sudt L1 lock_args')
    .requiredOption('--sudt-name <INT>', 'token name')
    .requiredOption('--sudt-symbol <INT>', 'token symbol')
    .option('--sudt-total-supply <INT>', 'token total supply', '9999999999')
    .option('--sudt-decimals <INT>', 'token decimals', '8')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(deploySudtErc20Proxy)
  ;
}

export async function deploySudtErc20Proxy(params: {
  network: Network;
  privateKey: string;
  sudtLockArgs: HexString;
  sudtName: string;
  sudtSymbol: string;
  sudtTotalSupply: string;
  sudtDecimals: string;
}) {
  const network = networks[params.network];
  const client = await createLightGodwokenByNetworkConfig(params.privateKey, network);

  const config = client.getConfig();
  const sudtId = await getL2SudtAccountId(addHexPrefix(params.sudtLockArgs), config);

  const signer = client.provider.ethereum.signer;
  const sudtTotalSupply = mustBeInteger(params.sudtTotalSupply, 'sudtTotalSupply');
  const sudtDecimals = mustBeInteger(params.sudtDecimals, 'sudtDecimals');

  const filePath = absolutePath('src/contracts/SudtERC20Proxy.bin');
  const sudtProxyBinary = await readFile(filePath, 'utf8');

  const factory = new ContractFactory(ERC20.abi, sudtProxyBinary, signer);
  const contract = await factory.deploy(
    params.sudtName,
    params.sudtSymbol,
    sudtTotalSupply,
    sudtId,
    sudtDecimals,
  );

  await contract.deployTransaction.wait();
  console.log('sudt-id:', sudtId);
  console.log('contract deployed: ', contract.address);
}
