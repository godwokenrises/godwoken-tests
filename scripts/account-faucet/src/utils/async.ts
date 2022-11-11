export async function retryIfFailed<T = any>(action: () => T, maxRetry = 3, interval = 1000) {
  let retries = 0;

  async function process(): Promise<T> {
    try {
      return await action();
    } catch(error) {
      if (retries < maxRetry) {
        retries++;
        await waitFor(interval);
        return await process();
      }
      throw error;
    }
  }

  return await process();
}

export function waitFor(interval: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, interval));
}
