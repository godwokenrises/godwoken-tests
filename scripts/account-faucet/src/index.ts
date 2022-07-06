import config from './config';
import { GodwokenWeb3 } from './web3';
import { privateKeyToLayer2DepositAddress, addressPairToLayer2DepositAddress } from './address';

async function main() {
  const gw = new GodwokenWeb3(config.rpc);
  const accounts = config.accounts.map(account => `0x${account}`);
  
  // console.log('accounts', accounts);
  // console.log(await privateKeyToLayer2DepositAddress(gw, accounts[0]));
  console.log(await addressPairToLayer2DepositAddress(
    gw,
    'ckt1q3uljza4azfdsrwjzdpea6442yfqadqhv7yzfu5zknlmtusm45hpuqd7m5zkx9fyhg2wpwreh2mf8j30gf2fe6cqdv7ald',
    '0xbedd05631524ba14e0b879bab693ca2f42549ceb'
  ));
}

main();