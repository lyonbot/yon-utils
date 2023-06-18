import { PromisePeekResult } from "./promise.js";

const promiseExFlag = Symbol('isPromiseEx');
export type PromiseEx<T> = Promise<T> & PromisePeekResult<T> & { [promiseExFlag]: true }


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
export function maybeAsync<T>(input: T | Promise<T> | (() => T | Promise<T>)): PromiseEx<T> {
  let promise: PromiseEx<T>

  // mark the Promise as 'rejected', update `reason`
  // and when user read `.value`, throw the error.
  const makePromiseError = (error: any) => {
    promise.status = 'rejected'
    promise.reason = error
    Object.defineProperty(promise, 'value', {
      enumerable: true,
      configurable: true,
      get() {
        promise.catch(() => 0); // error is already thrown in the sync process, suppress a potential unhandled rejection
        throw error
      }
    })
  }

  try {
    const rawResponse = (typeof input === "function") ? (input as any)() : input
    if (rawResponse && typeof rawResponse === 'object' && rawResponse[promiseExFlag] === true) {
      // already a PromiseEx. Maybe resolved already
      return rawResponse;
    }

    const toPromise = Promise.resolve(rawResponse) as PromiseEx<T>

    if (toPromise === rawResponse) {
      // rawResponse is a Promise
      promise = new Promise((resolve, reject) => {
        toPromise.then(result => {
          promise.status = 'fulfilled'
          promise.value = result
          resolve(result)
        }, error => {
          makePromiseError(error)
          reject(error)
        })
      }) as PromiseEx<T>
      promise.status = 'pending'
    } else {
      // already resolved
      promise = toPromise // Promise.resolve(rawResponse) as PromiseEx<T>
      promise.status = 'fulfilled'
      promise.value = rawResponse as T
    }
  } catch (error) {
    promise = Promise.reject(error) as PromiseEx<T>
    makePromiseError(error)
  }

  promise[promiseExFlag] = true
  return promise
}
