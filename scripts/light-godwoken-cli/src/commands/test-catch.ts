import { Command } from 'commander';
import { waitFor } from '../utils/async';

export default function setupTryCatch(program: Command) {
  program
    .command('test-catch')
    .action(tryCatch)
  ;
}

const promises: Promise<string>[] = [];
export async function tryCatch(params: {
  startAt?: number,
}) {
  try {
    const startAt = params.startAt ?? 0;
    const targets = [1, 2, 3, 4, 5];

    process.on('uncaughtException', (error, origin) => {
      console.log('global uncaught error:', origin, error);
    });

    for (let i = startAt; i < targets.length; i++) {
      const target = targets[i];
      async function expect() {
        try {
          await failInCallback(target);
          return `${target}-passed`;
        } catch {
          console.error(`caught error for target ${target}`);
          return `${target}-caught`;
        }
      }
      async function timeout() {
        await waitFor(500);
        return `${target}-timeout`;
      }
      async function race() {
        return await Promise.race([
          expect(),
          timeout(),
        ]);
      }

      promises.push(race());
      await waitFor(200);
    }

    const result = await Promise.all(promises);
    console.log('all promises handled', result);
  } catch(e) {
    console.error('caught error', e);
  }
}

async function failInCallback(target: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      if ([2, 4].includes(target)) {
        resolve();
      } else {
        throw new Error(`failing target ${target}`);
      }
    }, 200);
  });
}
