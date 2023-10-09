/**
 * Like golang and other language, use `defer(callback)` to properly release resources, and avoid `try catch finally` hells.
 * 
 * All deferred callbacks are invoked in `finally` blocks.
 * If one callback throws, its following callbacks still work. At the end, `withDefer` only throws the last Error.
 * 
 * ```js
 * // sync
 * const result = withDefer((defer) => {
 *   const file = openFileSync('xxx')
 *   defer(() => closeFileSync(file))  // <-
 * 
 *   const parser = createParser()
 *   defer(() => parser.dispose())  // <-
 * 
 *   return parser.parse(file.readSync())
 * })
 * ```
 * 
 * If using async functions, use `withAsyncDefer`
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
export function withDefer<Ret = any>(
  fn: (defer: withDefer.DeferFunction) => Ret
): Ret {
  return innerWithDefer(fn as any)
}

/**
 * Same as **withDefer** plus it returns a Promise, and supports async callbacks.
 * 
 * @see {@link withDefer}
 */
export function withAsyncDefer<Ret extends Promise<any> = any>(
  fn: (defer: withDefer.AsyncDeferFunction) => Ret
): Ret {
  return innerWithDefer(fn as any, { async: true })
}

export namespace withDefer {
  export interface DeferFunction<Ret = any> {
    (callback: () => Ret): void

    /** if callback throws, catch the error and ignore it */
    silent: (callback: () => Ret) => void
  }

  export type AsyncDeferFunction = DeferFunction<Promise<any> | void>

  export interface Options {
    async?: boolean
  }
}

function innerWithDefer<Ret = any>(
  fn: (defer: withDefer.DeferFunction) => Ret,
  options?: withDefer.Options
): Ret {
  let isAsync = !!(options && options.async);

  const queue = [] as (() => any)[];

  const defer = ((fn: () => any) => {
    if (typeof fn === 'function') queue.push(fn)
  }) as withDefer.DeferFunction<any>
  defer.silent = (callback) => {
    if (typeof fn !== 'function') return

    const newCallback: () => any
      = (isAsync)
        ? () => Promise.resolve().then(callback).catch(() => 0)
        : () => { try { callback() } catch { } }

    defer(newCallback)
  }

  const flushAsync = () => queue.reduce((p, fn) => p.finally(fn), Promise.resolve())
  const flushSync = () => {
    let i = 0, len = queue.length;
    let thrownError: any, hasThrown = false

    while (i < len) {
      try {
        while (i < len) queue[i++]()
      } catch (error) {
        hasThrown = true
        thrownError = error
      }
    }

    if (hasThrown) throw thrownError
  }

  if (isAsync) {
    return new Promise<Ret>(res => res(fn(defer))).finally(flushAsync) as Ret
  } else {
    try { return fn(defer) }
    finally { flushSync() }
  }
}