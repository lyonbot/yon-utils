import { maybeAsync, PromiseEx } from "../flow/promise.js";

type Query = string
type MaybePromise<T> = Promise<T> | T

export type ModuleLoaderCache<T = any> = {
  get(query: Query): T;
  set(query: Query, value: T): any;
  delete(query: Query): any;
  clear(): void;
}

export interface ModuleLoaderSource<T> {
  /**
   * You must implement a loader function. It parse `query` and returns the module content.
   * 
   * 1. It could be synchronous or asynchronous, depends on your scenario.
   * 2. You can use `load()` from `ctx` to load dependencies. Example: `await load("common")` or `load("common").value`
   * 3. All queries are cached by default. To bypass it, use `ctx.noCache`. Example: `return noCache("404: not found")`
   */
  resolve(query: Query, ctx: {
    /**
     * load another module - might load from cache
     */
    load(target: Query): PromiseEx<T>

    /**
     * mark this query result not-cached. example: `return noCache("404: not found")`
     */
    noCache<T>(value: T): T
  }): MaybePromise<T>
  cache?: ModuleLoaderCache
}

/**
 * All-in-one ModuleLoader, support both sync and async mode, can handle circular dependency problem.
 * 
 * ### Example in Sync
 * 
 * ```js
 * const loader = new ModuleLoader({
 *   // sync example
 *   resolve(query, { load }) {
 *     if (query === 'father') return 'John'
 *     if (query === 'mother') return 'Mary'
 * 
 *     // simple alias: just `return load('xxx')`
 *     if (query === 'mom') return load('mother')
 * 
 *     // load dependency
 *     // - `load('xxx').value` for sync, don't forget .value
 *     // - `await load('xxx')` for async
 *     if (query === 'family') return `${load('father').value} and ${load('mother').value}`
 * 
 *     // always return something as fallback
 *     return 'bad query'
 *   }
 * })
 * 
 * console.log(loader.load('family').value)  // don't forget .value
 * ```
 * 
 * ### Example in Async
 * 
 * ```js
 * const loader = new ModuleLoader({
 *   // async example
 *   async resolve(query, { load }) {
 *     if (query === 'father') return 'John'
 *     if (query === 'mother') return 'Mary'
 * 
 *     // simple alias: just `return load('xxx')`
 *     if (query === 'mom') return load('mother')
 * 
 *     // load dependency
 *     // - `await load('xxx')` for async
 *     // - no need `.value` in async mode
 *     if (query === 'family') return `${await load('father')} and ${await load('mother')}`
 * 
 *     // always return something as fallback
 *     return 'bad query'
 *   }
 * })
 * 
 * console.log(await loader.load('family'))  // no need `.value` with `await`
 * ```
 */
export class ModuleLoader<T> {
  cache: ModuleLoaderCache<{
    dependencies?: Query[]
    promise: PromiseEx<T>
  }>

  constructor(private source: ModuleLoaderSource<T>) {
    this.cache = source.cache || new Map();
  }

  /**
   * fetch a module
   */
  load(query: Query) {
    return this.internalLoad(query, [])
  }

  private internalLoad(query: Query, queryStack: Query[]): PromiseEx<T> {
    function throwCircularReferenceError(): never {
      throw new CircularDependencyError(query, queryStack)
    }

    let memory = this.cache.get(query)!;
    if (memory) {
      return memory.promise || maybeAsync(throwCircularReferenceError)
    }

    if (queryStack.includes(query)) throwCircularReferenceError()
    queryStack.push(query);

    memory = { promise: null as any }
    this.cache.set(query, memory)

    // ----------------------------------------------------------------
    // not cached yet. start loading!

    let noCacheSuppressed = false;
    const promise = maybeAsync(() => this.source.resolve(query, {
      load: (q) => {
        if (q === query) throwCircularReferenceError()

        if (!memory.dependencies) memory.dependencies = [q]
        else if (!memory.dependencies.includes(q)) memory.dependencies.push(q)

        return this.internalLoad(q, queryStack)
      },
      noCache: (value) => {
        if (!noCacheSuppressed) {
          noCacheSuppressed = true;
          Promise.resolve().then(() => promise).finally(() => this.cache.delete(query))
        }
        return value
      },
    }))

    return (memory.promise = promise)
  }

  /**
   * get all direct dependencies of a module.
   * 
   * note: to get reliable result, this will completely load the module and deep dependencies.
   */
  getDependencies(query: Query): PromiseEx<Query[]> {
    return this
      .load(query)
      .thenImmediately(() => this.cache.get(query).dependencies || [])
  }
}

/**
 * The circular dependency Error that `ModuleLoader` might throw.
 */
export class CircularDependencyError extends Error {
  /** the module that trying to be loaded. */
  query: Query

  /** the stack to traceback the loading progress.  */
  queryStack: Query[]

  /** always `'CircularDependencyError'` */
  name = 'CircularDependencyError'

  constructor(query: Query, queryStack: Query[]) {
    super(`Meet circular dependency: ${queryStack.join(' -> ')} ?> ${query}`)
    this.query = query
    this.queryStack = queryStack.slice()
  }
}
