export function delay(milliseconds: number) {
  return new Promise<void>(r => setTimeout(r, Math.max(~~milliseconds, 0)));
}

/**
 * Wrap an async nullary function. All actual calls will be suppressed until last Promise is resolved.
 * 
 * The suppressed call will return the running Promise, which is started before.
 */
export const debouncePromise = <T>(fn: () => Promise<T>) => {
  let promise: Promise<T> | undefined;
  return () => {
    if (!promise) {
      promise = fn();
      promise.finally(() => {
        promise = void 0;
      });
    }
    return promise;
  };
};
