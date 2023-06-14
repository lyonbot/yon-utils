export function delay(milliseconds: number) {
  return new Promise<void>(r => setTimeout(r, Math.max(~~milliseconds, 0)));
}

export interface PromisePeekResult<T> {
  status: 'fulfilled' | 'rejected' | 'pending';
  value?: T;
  reason?: any;
}

export interface PromiseHandle<T> {
  /**
   * make this Promise resolved / fulfilled with given value
   */
  resolve: (value: T) => void;

  /**
   * make this Promise rejected with given reason / error.
   */
  reject: (reason: any) => void;

  /**
   * wait for result. optionally can set a timeout in milliseconds.
   */
  wait: (timeout?: number) => Promise<T>;

  /**
   * check the Promise's status 
   * - returns `{ status, value, reason }`, whose `status` could be `"pending" | "fulfilled" | "rejected"` 
   */
  peek: () => PromisePeekResult<T>;
}

/**
 * Create a Promise and take out its `resolve` and `reject` methods.
 * 
 * @example
 * ```js
 * const handler = makePromise();
 * 
 * doSomeRequest(..., result => handler.resolve(result));
 * 
 * const result = await handler.wait();
 * ```
 */
export function makePromise<T>(): PromiseHandle<T> {
  let res: (ans: T) => void, rej: (err: any) => void

  let peekResult: ReturnType<PromiseHandle<T>['peek']> = { status: 'pending' }

  let promise = new Promise<T>((a, b) => {
    res = a;
    rej = b;
  })

  return {
    resolve: (ans: T) => {
      if (peekResult.status !== 'pending') return;
      peekResult.status = 'fulfilled'
      peekResult.value = ans
      res(ans)
    },
    reject: (err: any) => {
      if (peekResult.status !== 'pending') return
      peekResult.status = 'rejected'
      peekResult.reason = err
      rej(err);
    },
    wait: (timeout?: number) => {
      if (!timeout) return promise

      let timeoutError = new Error('Timeout')  // create the Error instance here, to keep the stacktrace
      return Promise.race([
        new Promise(res => setTimeout(() => res(timeoutError), timeout)),
        promise!
      ]).then(result => {
        if (result === timeoutError) throw timeoutError
        return result as T
      })
    },
    peek: () => ({ ...peekResult }),
  }
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
