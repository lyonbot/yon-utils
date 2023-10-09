export function delay(milliseconds: number) {
  return new Promise<void>(r => setTimeout(r, Math.max(~~milliseconds, 0)));
}

/**
 * Creates a debounced version of a function that returns a promise.
 *
 * The returned function will ensure that only one Promise is created and executed at a time,
 * even if the debounced function is called multiple times before last Promise gets finished.
 * 
 * All _suppressed_ calls will get the last started Promise.
 *
 * @param fn The function to be debounced.
 * @returns The debounced function.
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
