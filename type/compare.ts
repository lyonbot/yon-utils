const hasOwn = Object.prototype.hasOwnProperty;

/** 
 * the `Object.is` algorithm
 */
export function is(x: any, y: any) {
  if (x === y) return x !== 0 || y !== 0 || 1 / x === 1 / y;
  return x !== x && y !== y;
}

/**
 * @param depth - defaults to 1
 */
export function shallowEqual(objA: any, objB: any, depth = 1) {
  if (is(objA, objB)) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const k = keysA[i];
    if (!hasOwn.call(objB, k)) return false;

    const aa = objA[k];
    const bb = objB[k];
    if (depth > 1 ? !shallowEqual(aa, bb, depth - 1) : !is(aa, bb)) return false;
  }

  return true;
}
