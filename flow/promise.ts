import type { Nil } from "../type/types.js";

/**
 * a crafted Promise that exposes `{ status, value, reason }`
 * 
 * Note: please use `maybeAsync()` or `PromiseEx.resolve()` to create a PromiseEx
 */
export class PromiseEx<T> extends Promise<T> {
  status!: "pending" | "fulfilled" | "rejected";

  /** 
   * if rejected, get the reason.
   */
  reason?: any;

  /** 
   * get result, or nothing if not fulfilled.
   * 
   * note: you might need `.value` which follows **fail-fast mentality**
   */
  result?: T;

  constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
    let writingTo: Partial<PromiseEx<T>> = {
      status: "pending",
    }

    super((_resolve, _reject) => {
      const wrappedResolve = (result: Awaited<T>) => {
        if (writingTo.status !== 'pending') return
        writingTo.status = 'fulfilled'
        writingTo.result = result
        _resolve(result)
      }

      const wrappedReject = (reason: any) => {
        if (writingTo.status !== 'pending') return
        writingTo.status = 'rejected'
        writingTo.reason = reason
        _reject(reason)
      }

      try {
        executor(
          (result) => {
            // case 1: result could be a finished PromiseEx
            if (result instanceof PromiseEx && result.status !== 'pending') {
              if ((writingTo.status = result.status) === 'fulfilled') {
                _resolve(writingTo.result = result.result)
              } else {
                result.catch(() => 0) // inherit the rejection
                _reject(writingTo.reason = result.reason)
              }
              return
            }

            // case 2: result could be Promise
            if (result instanceof Promise) {
              return result.then(wrappedResolve, wrappedReject)
            }

            // case 3: resolved sync
            wrappedResolve(result as Awaited<T>)
          }, wrappedReject
        )
      } catch (reason) {
        wrappedReject(reason)
      }
    });

    Object.assign(this, writingTo)
    writingTo = this
  }

  /**
   * equivalent to `.status === "pending"`
   */
  get loading() {
    return this.status === 'pending'
  }

  /**
   * **fail-fast mentality**, safely get the result.
   * 
   * - if pending, throw `new PromisePendingError(this)`
   * - if rejected, throw `.reason`
   * - if fulfilled, get `.result`
   */
  get value() {
    if (this.status === 'pending') {
      throw new PromisePendingError(this);
    }

    if (this.status === 'rejected') {
      // error is already thrown in the sync process.
      // suppress a potential unhandled rejection in nextTick
      this.catch(() => 0);

      throw this.reason
    }

    return this.result
  }

  /**
   * wait for resolved / rejected. 
   * 
   * optionally can set a timeout in milliseconds. if timeout, a `PromisePendingError` will be thrown
   */
  wait(timeout: number): Promise<T> {
    if (!timeout || timeout < 0) return this

    const timeoutError = new PromisePendingError(this)  // create the Error instance here, to keep the stacktrace
    return Promise.race([
      new Promise(res => setTimeout(() => res(timeoutError), timeout)),
      this
    ]).then(result => {
      if (result === timeoutError) throw timeoutError
      return result as T
    })
  }

  /**
   * Like `then()` but immediately invoke callbacks, if this PromiseEx
   * is already resolved / rejected.
   */
  thenImmediately<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | Nil,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | Nil
  ): PromiseEx<TResult1 | TResult2> {
    return new PromiseEx<TResult1 | TResult2>((resolve, reject) => {
      if (this.status === 'pending') {
        resolve(this.then(onfulfilled, onrejected))
        return
      }

      if (this.status === 'rejected') {
        if (typeof onrejected === 'function') resolve(onrejected(this.reason))
        else reject(this.reason)
        return
      }

      const result = this.result
      const ans = typeof onfulfilled === 'function' ? onfulfilled(result!) : result
      resolve(ans as TResult1)
    })
  }

  static resolve(): PromiseEx<void>
  static resolve<T>(input: T): PromiseEx<Awaited<T>>
  static resolve<T>(input?: T | PromiseLike<T>) {
    return new PromiseEx<Awaited<T>>(resolve => resolve(input as any))
  }

  static reject<T = never>(reason?: any) {
    return new PromiseEx<T>((_, reject) => reject(reason))
  }
}

/**
 * Could be thrown from `.value` and `.wait(timeout)` of PromiseEx
 */
export class PromisePendingError extends Error {
  cause: Promise<any>

  constructor(cause: Promise<any>) {
    super('Promise is pending')
    this.cause = cause;
  }
}

/**
 * Run the function, return a crafted Promise that exposes `status`, `value` and `reason`
 * 
 * If `input` is sync function, its result will be stored in `promise.value` and `promise.status` will immediately be set as "fulfilled"
 * 
 * Useful when you are not sure whether `fn` is async or not.
 * 
 * @note if `fn` is sync function and throws an error, the `error` will be caught. You shall check the returned `status == "rejected"` and `reason`.
 * 
 * @param input - your sync/async function to run, or just a value
 * @returns a crafted Promise that exposes `{ status, value, reason }`, whose `status` could be `"pending" | "fulfilled" | "rejected"`
 */
export function maybeAsync<T>(input: T | Promise<T> | (() => T | Promise<T>)) {
  return new PromiseEx<Awaited<T>>((resolve, reject) => {
    if (typeof input === 'function') {
      try {
        // @ts-ignore
        input = input();
      } catch (error) {
        reject(error);
        return;
      }
    }
    resolve(input as any);
  })
}

/**
 * Create an imperative Promise.
 * 
 * Returns a Promise with these 2 methods exposed, so you can control its behavior:
 * 
 * - `.resolve(result)`
 * - `.reject(error)`
 * 
 * Besides, the returned Promise will expose these useful properties
 * so you can get its status easily:
 *  
 * - `.wait([timeout])` — wait for result, if timeout set and exceeded, a `PromisePendingError` will be thrown
 * - `.status` — could be `"pending" | "fulfilled" | "rejected"`
 * - `.result` and `.reason`
 * - `.value` — fail-safe get result (or cause an Error from rejection, or cause a `PromisePendingError` if still pending)
 * 
 * @example
 * ```js
 * const handler = makePromise();
 * 
 * doSomeRequest(..., result => handler.resolve(result));
 * 
 * // wait with timeout
 * const result = await handler.wait(1000);
 * 
 * // or just await
 * const result = await handler;
 * ```
 */
export function makePromise<T>() {
  let res: (ans: T) => void, rej: (err: any) => void

  const promise = new PromiseEx<T>((a, b) => {
    res = a;
    rej = b;
  }) as ImperativePromiseEx<T>

  promise.resolve = res!;
  promise.reject = rej!
  return promise;
}

export type ImperativePromiseEx<T> = PromiseEx<Awaited<T>> & {
  resolve(result: T | PromiseLike<T>): void
  reject(reason?: any): void
}
