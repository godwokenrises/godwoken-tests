import { Address } from "@ckb-lumos/base";
import { retryIfFailed, waitFor } from './async';
import { closeBrowser, getElementHandleProperty, openBrowser } from './puppeteer';

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
  txStatus: string;
  capacity: string;
  fee: string;
  status: ClaimStatus;
  txHash?: ClaimTxStatus;
}
export enum ClaimTxStatus {
  Pending = 'pending',
  Committed = 'committed',
  Rejected = 'rejected',
}
export enum ClaimStatus {
  Pending = 'pending',
  Processed = 'processed'
}

export async function claimFaucetForCkbAddress(ckbAddress: Address) {
  const browser = await openBrowser();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const input = await retryIfFailed(async () => {
    const input = await page.$('.container-fluid input[name=address_hash]');
    if (!input) throw new Error(`deposit input not exists in: "${url}"`);

    return input;
  });

  console.log(`[claim-start] claim for: ${ckbAddress}`);
  
  // Type address into the input
  await input.focus();
  await input.type(ckbAddress);

  // Press Enter to submit, and wait for 500ms
  await input.press('Enter', { delay: 200 });
  await waitFor(1000);

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
    async function waitForResult() {
      const maxRetries = 30;
      await waitFor(1000);

      let found = false;
      for (let i = 1; i <= maxRetries; i++) {
        const events = await getAddressClaimEvents(ckbAddress);
        const event = events.length ? events[0] : null;

        if (!found && event?.status === ClaimStatus.Pending) {
          found = true;
        }

        if (found && event?.txStatus) {
          switch (event.txStatus) {
            case ClaimTxStatus.Pending:
              console.log(`[claim-pending] Claim pending (reties: ${i}/${maxRetries})`);
              break;
            case ClaimTxStatus.Committed:
              console.log(`[claim-committed] Claim committed: capacity: ${event.capacity} CKB, tx: ${event.txHash}`);
              return;
            case ClaimTxStatus.Rejected:
              throw new Error(`[claim-rejected] Claim transaction has been rejected, tx: ${event.txHash}`);
          }
        } else {
          console.log(`[claim-not-found] Claim submitted, but no logs found (reties: ${i}/${maxRetries})`);
        }
        if (i < maxRetries) {
          await waitFor(6000);
        }
      }

      throw new Error(`[claim-timeout] Claim failed for waited too long without a result`);
    }

    try {
      await waitForResult();
    } catch (e) {
      console.error((e as Error).message);
    }
  }

  await page.close();
  await closeBrowser();
}

export async function getAddressClaimEvents(depositAddress: Address) {
  const browser = await openBrowser();
  const page = await browser.newPage();
  await page.goto(`${url}/claim_events/${depositAddress}`, { waitUntil: 'networkidle2' });

  const body = await page.$('pre');
  let result: ClaimEvent[] = [];
  if (body) {
    const content = JSON.parse(await getElementHandleProperty(body!, 'textContent'));
    const data: FaucetEvent<ClaimEvent>[] = content.data;
    result = data.map((row) => row.attributes);
  }

  await page.close();
  await closeBrowser();

  return result;
}
