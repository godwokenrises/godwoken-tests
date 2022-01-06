import { Godwoker } from '@polyjuice-provider/base';
import { HexString, Script } from "@ckb-lumos/base";
import { retry, sleep } from './utils';
import { Logger } from "@ethersproject/logger";
import path from "path";
import dotenv from "dotenv";

const logger = Logger.globalLogger();
const INTERVAL = 50; // ms

dotenv.config({
  path: path.resolve(process.env.ENV_PATH ?? "./testnet.env"),
});
const godwoker = new Godwoker(process.env.GW_WEB3_URL);
const {
  ETH_ACCOUNT_LOCK_CODE_HASH,
  TRON_ACCOUNT_LOCK_CODE_HASH,

  META_CONTRACT_CODE_HASH,
  L2_SUDT_CONTRACT_CODE_HASH,
  POLYJUICE_CONTRACT_CODE_HASH,
} = process.env;
const ZERO_HASH = `0x${"0".repeat(64)}`;

/**
```ts
enum AddressType {
  eoaAddress,              // externally owned account (EOA) created by or for human users
  contractAddress,         // equals to gw_short_script_hash
  notExistEoaAddress,      // haven't been created by depositing into godwoken
  notExistContractAddress, // create2 contract which haven't really created
  creatorAddress,          // meta-contract address: 0x00000...
}
```
 */
enum AccountType {
  ZERO = "zero_script_hash",

  META_CONTRACT = "meta_contract",
  SUDT_CONTRACT = "sudt_contract",
  POLYJUICE_CONTRACT = "polyjuice_contract",

  CREATOR = "polyjuice_creator",

  ETH_EOA = "eth_eoa",
  TRON_EOA = "tron_eoa",
}

type AccountAnalysisResult = {
  [accountType in AccountType]: number;
};

interface IAccount {
  id: number;
  scriptHash?: HexString;
  type?: AccountType;
}
class Account implements IAccount {
  id: number;
  scriptHash?: HexString;
  script?: Script;
  type?: AccountType;

  constructor(id: number) {
    this.id = id;
  }

  async getScript(): Promise<Script> {
    if (this.script) return this.script;

    const scriptHash = await this.getScriptHash();
    this.script = await retry(
      () => godwoker.getScriptByScriptHash(scriptHash)
    ).catch(reason => {
      console.error(`failed to get Script of account_${this.id}`);
      console.error(reason);
      return undefined;
    });
    return this.script;
  }

  async getScriptHash(): Promise<HexString> {
    if (this.scriptHash) return this.scriptHash;
    this.scriptHash = await retry(
      () => godwoker.getScriptHashByAccountId(this.id)
    ).catch(reason => {
      console.error(`failed to get scriptHash of account_${this.id}`);
      console.error(reason);
      return undefined;
    });
    return this.scriptHash;
  }
}
const accounts: Account[] = [];

async function getGodwokenInfo() {
  console.debug("creator account ID:", await godwoker.getPolyjuiceCreatorAccountId());
}

async function initAccounts() {
  // TODO: fetch max_account_id
  const maxAccountId = 10000;

  let stopSignal = false;
  for (let id = 0; id < maxAccountId; id++) {
    accounts.push(new Account(id));
    accounts[id].getScriptHash().then(scriptHash => {
      logger.debug(`scriptHash of account ${id} is ${scriptHash}`);
    });
    await sleep(INTERVAL);

    // TODO: stopSignal
    if (stopSignal) {
      break;
    }
  }
}

(async function analyze(): Promise<void> {
  await getGodwokenInfo();

  initAccounts();

  let result: AccountAnalysisResult = {
    [AccountType.ZERO]: 0,
    [AccountType.CREATOR]: 0,
    [AccountType.ETH_EOA]: 0,
    [AccountType.TRON_EOA]: 0,
    [AccountType.META_CONTRACT]: 0,
    [AccountType.SUDT_CONTRACT]: 0,
    [AccountType.POLYJUICE_CONTRACT]: 0,
  };

  let idx = -1;
  const polyCreatorId = await godwoker.getPolyjuiceCreatorAccountId();
  while (++idx < accounts.length) { // check the type of all accounts
    if (await accounts[idx].getScriptHash() === ZERO_HASH) {
      accounts[idx].type = AccountType.ZERO;
      result[AccountType.ZERO]++;
      logger.warn(`Account_${idx}'s scriptHash is ZERO_HASH`);
      continue;
    }

    // detect creator account
    if (parseInt(polyCreatorId) === idx) {
      accounts[idx].type = AccountType.CREATOR;
      result[AccountType.CREATOR]++;
      console.log(`Account_${idx} is the Polyjuice creator.`);
      continue;
    }

    const script = await accounts[idx].getScript();
    switch (script.code_hash) {
      case META_CONTRACT_CODE_HASH:
        console.log(`Account_${idx} is a meta contract.`);
        accounts[idx].type = AccountType.META_CONTRACT;
        result[AccountType.META_CONTRACT]++;
        break;
      case L2_SUDT_CONTRACT_CODE_HASH:
        console.log(`Account_${idx} is a sUDT contract.`);
        accounts[idx].type = AccountType.SUDT_CONTRACT;
        result[AccountType.SUDT_CONTRACT]++;
        break;
      case POLYJUICE_CONTRACT_CODE_HASH:
        console.log(`Account_${idx} is a Polyjuice contract.`);
        accounts[idx].type = AccountType.POLYJUICE_CONTRACT;
        result[AccountType.POLYJUICE_CONTRACT]++;
        break;
      case ETH_ACCOUNT_LOCK_CODE_HASH:
        console.log(`Account_${idx} is an ETH externally owned account.`);
        accounts[idx].type = AccountType.ETH_EOA;
        result[AccountType.ETH_EOA]++;
        break;
      case TRON_ACCOUNT_LOCK_CODE_HASH:
        console.log(`Account_${idx} is a Tron externally owned account.`);
        accounts[idx].type = AccountType.TRON_EOA;
        result[AccountType.TRON_EOA]++;
        break;
      default:
        console.error("undefined script code hash");
        break;
    }

    await sleep(INTERVAL + 10);
  }

  logger.info(`Total account num: ${accounts.length}`);
  logger.info(result);
})();