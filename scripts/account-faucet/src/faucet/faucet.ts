import puppeteer from 'puppeteer';
import { Address, HexString } from "@ckb-lumos/base";

// Faucet url
const url = 'https://faucet.nervos.org';

export interface FaucetEvent<T> {
  id: number;
  type: string;
  attributes: T;
}
export interface ClaimEvent {
  id: number;
  timestamp: number;
  addressHash: Address;
  txHash?: HexString;
  txStatus: string;
  capacity: string;
  fee: string;
  status: ClaimStatus;
}
export enum ClaimStatus {
  Pending = 'pending',
  Processed = 'processed'
}

export async function claimFaucetForCkbAddress(ckbAddress: Address) {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const input = await retryIfFailed(async () => {
    const input = await page.$('.container-fluid input[name=address_hash]');
    if (!input) throw new Error(`deposit input not exists in: "${url}"`);

    return input;
  });

  console.log(`[claim-start] Address: ${ckbAddress}`);
  
  // Type address into the input
  await input.focus();
  await input.type(ckbAddress);

  // Press Enter to submit, and wait for 500ms
  await input.press('Enter', { delay: 200 });
  await waitFor(500);

  // Check if encountered error
  const inputClass = await getElementHandleProperty<string>(input, 'className');
  
  // Show result
  if (inputClass.includes('is-invalid')) {
    const feedback = await page.$('.container-fluid .invalid-feedback');

    if (feedback) {
      const feedbackText = await getElementHandleProperty<string>(feedback, 'textContent');
      console.error(`[claim-error] ${feedbackText}`);
    } else {
      console.error(`[claim-error] Encountered error but cannot find feedback message`);
    }
  } else {
    let retries = 0;
    await waitFor(1000);

    try {
      await retryIfFailed(async () => {
        const events = await getAddressClaimEvents(ckbAddress);
        const event = events.length ? events[0] : null;
        if (event?.status === ClaimStatus.Processed) {
          console.log(`[claim-processed] Claim processed: capacity: ${event.capacity} CKB, tx: ${event.txHash}`);
        } else if (event?.status === ClaimStatus.Pending) {
          retries++;
          const message = `[claim-pending] Claim pending (reties: ${retries}/30)`;
          console.log(message);
          throw new Error(message);
        } else {
          retries++;
          const message = `[claim-no-log] Claim submitted, but no logs found (reties: ${retries}/30)`;
          console.log(message);
          throw new Error(message);
        }
      }, 36, 5000);
    } catch (e: any) {
      console.error(e.message);
    }
  }

  await browser.close();
}

export async function getAddressClaimEvents(depositAddress: Address, parentBrowser?: puppeteer.Browser) {
  const browser = parentBrowser ?? await puppeteer.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto(`https://faucet.nervos.org/claim_events/${depositAddress}`, { waitUntil: 'networkidle2' });

  const body = await page.$('pre');
  let result: ClaimEvent[] = [];
  if (body) {
    const content = JSON.parse(await getElementHandleProperty(body!, 'textContent'));
    const data: FaucetEvent<ClaimEvent>[] = content.data;
    result = data.map((row) => row.attributes);
  }
  
  if (parentBrowser) {
    await page.close();
  } else {
    await browser.close();
  }

  return result;
}

async function retryIfFailed<T = any>(action: () => T, maxRetry = 3, interval = 1000) {
  let retries = 0;

  async function process(): Promise<T> {
    try {
      return await action();
    } catch(error) {
      if (retries < maxRetry) {
        await waitFor(interval);
        retries += 1;
        return await process();
      } else {
        throw error;
      }
    }
  }

  return await process();
}

function waitFor(interval: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, interval));
}

async function getElementHandleProperty<T = any>(handle: puppeteer.ElementHandle, property: string): Promise<T> {
  const prop = await handle!.getProperty(property);
  return await prop.jsonValue() as T;
}
