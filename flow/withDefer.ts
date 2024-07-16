import { fnQueue } from "./fnQueue.js"

/**
 * This is a wrapper of `fnQueue`, inspired by golang's `defer` keyword.
 * You can add dispose callbacks to a stack, and they will be invoked in `finally` stage.
 * 
 * No more `try catch finally` hells!
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
 * If you want to suppress the callbacks' throwing, use `defer.silent`
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

type Defer = fnQueue.FnQueue<[]>['tap']

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
  isAsync: boolean
): Ret {
  const queue = fnQueue<[]>(isAsync, true, 'throwLastError')
  const defer = queue.tap

  if (isAsync) {
    return new Promise<Ret>(res => res(fn(defer))).finally(() => queue()) as Ret
  } else {
    try { return fn(defer) }
    finally { queue() }
  }
}