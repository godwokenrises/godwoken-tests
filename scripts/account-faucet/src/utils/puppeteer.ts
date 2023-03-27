import puppeteer, { Browser } from 'puppeteer';

let browser: Browser | undefined;

export async function openBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true
    });
  }

  return browser.createIncognitoBrowserContext();
}

export async function closeBrowser() {
  if (!browser) return;

  // When the browser opens, it comes with a default page
  const pages = await browser.pages();
  if (pages.length <= 1) {
    await browser.close();
    browser = void 0;
  }
}

export async function getElementHandleProperty<T = any>(handle: puppeteer.ElementHandle, property: string): Promise<T> {
  const prop = await handle!.getProperty(property);
  return await prop.jsonValue() as T;
}
