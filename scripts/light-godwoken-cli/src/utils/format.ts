import { HexString } from '@ckb-lumos/base';

export function isAllDefinedOrAllNot(targets: unknown[]) {
  let exist = false;
  for (let i = 0; i < targets.length; i++) {
    const isDefined = targets[i] !== void 0 && targets[i] !== null;
    const isString = typeof targets[i] === 'string';
    const isEmptyString = isString && (targets[i] as string).trim().length === 0;

    if (isDefined && !isEmptyString) {
      exist = true;
    }
    if (exist && !targets[i]) {
      return false;
    }
  }

  return true;
}

export function mustBeInteger(target: string, name: string) {
  const converted = Number(target);
  if (Number.isNaN(converted) || !Number.isInteger(converted)) {
    throw new Error(`${name} must be an integer, current value: ${target}`);
  }

  return parseInt(target);
}

export function toHexString(target: string): HexString {
  return !target.startsWith('0x') ? `0x${target}` : target;
}

export function toNonHexString(target: string): string {
  return target.startsWith('0x') ? target.slice(2) : target;
}
