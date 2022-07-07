import puppeteer from 'puppeteer';
import { Address } from "@ckb-lumos/base";

// Faucet url
const url = 'https://faucet.nervos.org';

export async function claimFaucetForCkbAddress(ckbAddress: Address) {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const input = await retryIfFailed(async () => {
    const input = await page.$('.container-fluid input[name=address_hash]');
    if (!input) throw new Error(`deposit inputnot exists in: "${url}"`);

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
    console.log(`[claim-success] Claimed 10000 CKB on testnet`);
  }

  await browser.close();
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

async function getElementHandleProperty<T = unknown>(handle: puppeteer.ElementHandle<Element>, property: string): Promise<T> {
  return await (await handle!.getProperty(property)).jsonValue();
}