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
