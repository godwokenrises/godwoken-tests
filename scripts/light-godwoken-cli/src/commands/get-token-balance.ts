import ERC20 from '../contracts/ERC20.json';
import { Command, Option } from 'commander';
import { Contract, providers } from 'ethers';
import { HexString } from '@ckb-lumos/base';
import { Network } from '../config';
import { getConfig } from '../utils/config';
import { addHexPrefix } from '../utils/format';

export default function setupGetTokenBalance(program: Command) {
  program
    .command('get-token-balance')
    .description('Get token balance of an account')
    .argument('<HEX_STRING>', 'token address')
    .argument('<HEX_STRING>', 'account eth-address')
    .addOption(
      new Option('-n, --network <NETWORK>', 'network to use')
        .choices(Object.values(Network))
        .default(Network.TestnetV1)
    )
    .action(async (...args: Parameters<typeof getTokenBalance>) => {
      await getTokenBalance(...args);
    })
  ;
}

export async function getTokenBalance(contractAddress: HexString, ethAddress: HexString, params: {
  network: Network;
}) {
  const network = getConfig(params.network);
  const provider = new providers.JsonRpcProvider(network.rpc);
  const erc20 = new Contract(addHexPrefix(contractAddress), ERC20.abi, provider);

  const balance = await erc20.callStatic.balanceOf(addHexPrefix(ethAddress))

  const formatted = balance.toString();
  console.log(formatted);
  return formatted;
}
