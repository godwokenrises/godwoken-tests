import { HexString } from '@ckb-lumos/base';

export function isAllDefinedOrAllNot(targets: unknown[]) {
  let status: boolean[] = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const isDefined = target !== void 0 && target !== null;
    const isNotEmptyString = typeof target !== 'string' || target.trim().length > 0;

    const result = isDefined && isNotEmptyString;
    if (!status.includes(result)) {
      status.push(result);
    }
    if (status.length > 1) {
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

export function addHexPrefix(target: string): HexString {
  return !target.startsWith('0x') ? `0x${target}` : target;
}

export function removeHexPrefix(target: string): string {
  return target.startsWith('0x') ? target.slice(2) : target;
}
