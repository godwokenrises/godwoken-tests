export function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export async function retry<T>(fn: () => Promise<T>, retriesLeft = 3, interval = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn(error);
    console.log("=".repeat(80));
    if (retriesLeft === 0) {
      throw new Error(`Max retries reached for function ${fn.name}`);
    }
    await sleep(interval);
    return await retry(fn, --retriesLeft, interval);
  }
}