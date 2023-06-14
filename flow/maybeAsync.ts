import { PromisePeekResult } from "./promise.js";

type PromiseEx<T> = Promise<T> & PromisePeekResult<T>

/**
 * Run the function, return a crafted Promise that exposes `status`, `value` and `reason`
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

  try {
    const rawResponse = (typeof input === "function") ? (input as any)() : input
    const toPromise = Promise.resolve(rawResponse) as PromiseEx<T>

    if (toPromise === rawResponse) {
      // rawResponse is a Promise
      promise = new Promise((resolve, reject) => {
        toPromise.then(result => {
          promise.status = 'fulfilled'
          promise.value = result
          resolve(result)
        }, error => {
          promise.status = 'rejected'
          promise.reason = error
          reject(error)
        })
      }) as PromiseEx<T>
      promise.status = 'pending'
    } else {
      // already resolved
      promise = Promise.resolve(rawResponse) as PromiseEx<T>
      promise.status = 'fulfilled'
      promise.value = rawResponse as T
    }
  } catch (error) {
    promise = Promise.reject(error) as PromiseEx<T>
    promise.status = "rejected"
    promise.reason = error
  }

  return promise
}
