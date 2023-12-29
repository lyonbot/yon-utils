import { Nil, isThenable } from "../type/types.js";

const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

/**
 * Measures time of execution of `executeFn()`. Works on async function and Promise too.
 * 
 * @param output - can be:
 *  - a `(timeMs, sinceMs) => void`
 *  - a `string` - print labelled result with `timing.defaultPrint()`, defaults to console.log
 * 
 * @param fn - actual logic to run. can be async function, or just a Promise
 * 
 * @returns result of `fn()`
 * 
 * @example
 * 
 * ```js
 * const result = timing('read', () => {
 *   const data = fs.readFileSync('xxx');
 *   const decrypted = crypto.decrypt(data, key);
 *   return decrypt;
 * })
 * 
 * // get result
 * // meanwhile, console prints "[read] took 120ms"
 * ```
 * 
 * Or with custom logger
 * 
 * ```js
 * const print = (ms) => console.log(`[timing] fetching took ${ms}ms`)
 * 
 * const result = await timing(print, async () => {
 *   const resp = await fetch('/user/xxx');
 *   const user = await resp.json();
 *   return user;
 * })
 * ```
 */
export function timing<T>(output: Nil | string | timing.PrintMethod, fn: () => T): T
export function timing<T extends Promise<any>>(output: Nil | string | timing.PrintMethod, promise: T): T
export function timing<T>(output: Nil | string | timing.PrintMethod, executeFn: () => T): T {
  const callback: timing.PrintMethod = typeof output === 'function'
    ? output
    : (ms) => output && (timing.defaultPrint || defaultPrint)(output, ms, sinceUnix)

  if (isThenable(executeFn) && typeof executeFn !== 'function') {
    const promise = executeFn
    executeFn = (() => promise) as any
  } else if (typeof executeFn !== 'function') {
    return undefined as T
  }

  // --------------------------------

  const sinceUnix = Date.now()
  const from = now()

  const seal = () => {
    const elapsedMs = now() - from
    callback(elapsedMs, sinceUnix)
  }

  try {
    const ans = executeFn!()
    if (isThenable(ans)) {
      return (ans as any as Promise<any>).finally(seal) as T
    }

    seal()
    return ans
  } catch (e) {
    seal()
    throw e
  }
}

export namespace timing {
  export type PrintMethod = (ms: number, sinceMs: number) => void
  export type DefaultPrintMethod = (label: string, ms: number, sinceMs: number) => void
  export var defaultPrint: DefaultPrintMethod | undefined
}

const defaultPrint: timing.DefaultPrintMethod = (label, ms, sinceMs) => {
  console.log(`[timing] ${label} took ${ms}ms`)
}
