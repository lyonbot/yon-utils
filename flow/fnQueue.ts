import { Fn, Falsy } from "../type/types.js";

export namespace FnQueue {
  export interface Options {
    async: boolean
    filo: boolean
    onetime: boolean
    error: 'abort' | 'throwLastError' | 'ignore'
  }

  export type Factory<R = void> = {
    <Args extends any[] = any[]>(async: true, FILO?: boolean, error?: 'abort' | 'throwLastError' | 'ignore'): FnQueue<Args, Promise<void>>
    <Args extends any[] = any[]>(async: boolean, FILO?: boolean, error?: 'abort' | 'throwLastError' | 'ignore'): FnQueue<Args, any>
    <Args extends any[] = any[]>(options: Partial<Options>): FnQueue<Args, R>
    <Args extends any[] = any[]>(): FnQueue<Args, R>

    async: Factory<Promise<void>>

    /** change execution order to FILO (first-in, last-out, like a stack) */
    filo: Factory<R>

    /** after each call, clear the queue */
    onetime: Factory<R>
  }

  export type AddCallbacks<Args extends any[]> = {
    (...fns: (Fn<any, Args> | Falsy)[]): void;
    silent(...fns: (Fn<any, Args> | Falsy)[]): void;
  }

  export type FnQueue<Args extends any[] = any[], RET = void> = {
    (...args: Args): RET

    /** add one or more functions. */
    tap: AddCallbacks<Args>

    /** add functions, and will silently ignore their errors */
    tapSilent: AddCallbacks<Args>

    /** run functions. if fnQueue is async, returns Promise */
    call: (...args: Args) => RET;

    /** the queued functions */
    queue: { silent?: boolean; fn: Fn<any, Args> }[];
  }
}

/**
 * Store a list of functions, and execute them in order.
 * 
 * - **Use case**: 🧹 disposer (clean resources) / ⚡ event emitter / 🪢 tapable-like middleware
 * - **Defaults**: sync, FIFO, errors will abort
 * 
 * Use decorators or options, to customize a fnQueue:
 * 
 * - `fnQueue.async()` to create async queue -- the `call()` will return a Promise instead.
 * - `fnQueue.filo()` to create FILO queue.
 * - `fnQueue.onetime()` to clear the queue after each call.
 * - `fnQueue({ error: 'ignore' })` to ignore errors.
 * 
 * Options can be combined, like `fnQueue.async.onetime()` -- see example below.
 * 
 * @example
 * ```js
 * // create an async fnQueue with options ...
 * const disposer = fnQueue.async.onetime({ error: 'ignore' });
 * 
 * try {
 *   const srcFile = await openFile(path1);
 *   disposer.tap(() => srcFile.close());
 * 
 *   const dstFile = await openFile(path2);
 *   disposer.tap(() => dstFile.close());
 * 
 *   await copyData(srcFile, dstFile);
 * } finally {
 *   await disposer.call();
 * }
 * ```
 */
export const fnQueue = getFnQueueFactory({ async: false, filo: false, onetime: false, error: 'abort' })

function getFnQueueFactory(options: FnQueue.Options) {
  const ans = (async?: boolean | object, filo?: boolean, error?: any) => {
    const o = { ...options }
    if (async && typeof async === 'object') {
      Object.assign(o, async)
    } else {
      if (async) o.async = true
      if (filo) o.filo = true
      if (error) o.error = error
    }
    return createFnQueue(o)
  }

  Object.defineProperty(ans, 'async', { get: () => getFnQueueFactory({ ...options, async: true }) })
  Object.defineProperty(ans, 'filo', { get: () => getFnQueueFactory({ ...options, filo: true }) })
  Object.defineProperty(ans, 'onetime', { get: () => getFnQueueFactory({ ...options, onetime: true }) })

  return ans as unknown as FnQueue.Factory;
}

function createFnQueue<ARGS extends any[] = any[]>(options: FnQueue.Options): FnQueue.FnQueue<ARGS, any> {
  type F = Fn<any, ARGS>

  const { async, filo, onetime, error } = options;
  const queue = [] as FnQueue.FnQueue<ARGS>['queue'];

  const errorSilent = error === 'ignore';
  const throwLastError = error === 'throwLastError';

  function call(...args: ARGS) {
    let finalError: any;
    let tasks = onetime ? queue.splice(0) : queue.slice()
    if (filo) tasks = tasks.reverse();

    if (async) {
      const shift = (p: Promise<void>): Promise<void> => tasks.length
        ? p.then(() => {
          const task = tasks.shift()!;
          let p0 = p.then(() => task.fn(...args));
          if (task.silent || errorSilent) p0 = p0.catch(() => void 0);
          else if (throwLastError) p0 = p0.catch(err => (finalError = err));
          return p0.then(() => shift(p));
        })
        : p.then(() => { if (finalError) throw finalError; });
      return shift(Promise.resolve());
    }

    for (const task of tasks) {
      try {
        task.fn(...args);
      } catch (err) {
        if (task.silent || errorSilent) continue;
        if (throwLastError) finalError = err;
      }
    }

    if (finalError) throw finalError;
  }

  function tap(...fns: (F | Falsy)[]) {
    queue.push(...(fns.filter(f => f && typeof f === 'function') as Fn[]).map(fn => ({ fn })));
  }
  tap.silent = function (...fns: (F | Falsy)[]) {
    queue.push(...(fns.filter(f => f && typeof f === 'function') as Fn[]).map(fn => ({ fn, silent: true })));
  }

  call.tap = tap;
  call.tapSilent = tap.silent as any;
  call.call = call;
  call.queue = queue;

  return call;
}