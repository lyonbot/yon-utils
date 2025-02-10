import { FnQueue, fnQueue } from "./fnQueue.js"

/**
 * Get rid of `try catch finally` hells!
 * Use `defer(callback)` to clean up resources, and they will run in `finally` stage.
 * 
 * Works on both sync and async procedures.
 * 
 * For sync functions:
 * 
 * ```js
 * // sync
 * const result = withDefer((defer) => {
 *   const file = openFileSync('xxx')
 *   defer(() => closeFileSync(file))  // <- register callback
 * 
 *   const parser = createParser()
 *   defer(() => parser.dispose())  // <- register callback
 * 
 *   return parser.parse(file.readSync())
 * })
 * ```
 * 
 * For async functions, use `withAsyncDefer`
 * 
 * ```js
 * // async
 * const result = await withAsyncDefer(async (defer) => {
 *   const file = await openFile('xxx')
 *   defer(async () => await closeFile(file))  // <- defer function can be async now!
 * 
 *   const parser = createParser()
 *   defer(() => parser.dispose())  // <-
 * 
 *   return parser.parse(await file.read())
 * })
 * ```
 * 
 * **Error handling**
 * 
 * If one callback throws, rest callbacks still work. And you get the last error thrown.
 * 
 * To suppress a callback's throwing, use `defer.silent(callback)`
 * 
 * ```js
 * defer.silent(() => closeFile(file))  // will never throws
 * ```
 * 
 * @remark Refer to [TypeScript using syntax](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management),
 * [TC39 Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) and GoLang's `defer` keyword.
 */
export function withDefer<Ret = any>(fn: (defer: Defer) => Ret): Ret {
  return innerWithDefer(fn as any, false)
}

type Defer = FnQueue.FnQueue<[]>['tap']

/**
 * Same as **withDefer**, but this returns a Promise, and supports async callbacks.
 * 
 * @see {@link withDefer}
 */
export function withAsyncDefer<Ret extends Promise<any> = any>(fn: (defer: Defer) => Ret): Ret {
  return innerWithDefer(fn as any, true)
}

function innerWithDefer<Ret = any>(
  fn: (defer: Defer) => Ret,
  async: boolean
): Ret {
  const queue = fnQueue<[]>({ async, error: 'throwLastError', filo: true, onetime: true })
  const defer = queue.tap

  if (async) {
    return new Promise<Ret>(res => res(fn(defer))).finally(() => queue()) as Ret
  } else {
    try { return fn(defer) }
    finally { queue() }
  }
}