import { Fn, Falsy } from "../type/types.js";

export namespace fnQueue {
  type Tap<ARGS extends any[]> = (...fns: (Fn<any, ARGS> | Falsy)[]) => void;

  /**
   * the return value of `fnQueue`
   */
  export type FnQueue<ARGS extends any[] = any[], RET = void> = {
    (...args: ARGS): RET

    /** add functions to queue. see example. use *tap.silent(fns)* to ignore errors */
    tap: Tap<ARGS> & { silent: Tap<ARGS> };

    /** add functions to queue, but silently ignore their errors (identical to *tap.silent*) */
    tapSilent: Tap<ARGS>

    /** clear the queue, execute functions */
    call: (...args: ARGS) => RET;

    /** the queued functions */
    queue: { silent?: boolean; fn: Fn<any, ARGS> }[];
  }
}

/**
 * @example
 * 
 * With `fnQueue`, you can implement a simple disposer to avoid resource leaking.
 * 
 * **Order of execution**: defaults to FIFO (first in, last run); set 1st argument to `true` to reverse the order (FILO)
 * 
 * **Exceptions**: queued functions shall NOT throw errors, otherwise successive calls will be aborted.
 * 
 * ```js
 * const dispose = fnQueue();
 * try {
 *   const srcFile = await openFile(path1);
 *   dispose.tap(() => srcFile.close());
 * 
 *   const dstFile = await openFile(path2);
 *   opDispose.tap(() => dstFile.close());
 * 
 *   await copyData(srcFile, dstFile);
 * } finally {
 *   // first call:
 *   dispose(); // close handles
 *
 *   // second call:
 *   dispose(); // nothing happens -- the queue is emptied
 * }
 * ```
 * 
 * @param async - if true, all queued functions are treated as async, and we return a Promise in the end.
 * @param reversed - if true, the order of execution is reversed (FILO, like a stack)
 * @param error - if met error, shall we 'abort' immediately, or 'throwLastError', or 'ignore' all errors
 */
export function fnQueue<ARGS extends any[] = any[]>(async: true, reversed?: boolean, error?: 'abort' | 'throwLastError' | 'ignore'): fnQueue.FnQueue<ARGS, Promise<void>>
export function fnQueue<ARGS extends any[] = any[]>(async?: boolean, reversed?: boolean, error?: 'abort' | 'throwLastError' | 'ignore'): fnQueue.FnQueue<ARGS, void>
export function fnQueue<ARGS extends any[] = any[]>(async?: boolean, reversed?: boolean, error?: 'abort' | 'throwLastError' | 'ignore'): fnQueue.FnQueue<ARGS> {
  type F = Fn<any, ARGS>
  const queue = [] as fnQueue.FnQueue<ARGS>['queue'];

  const errorSilent = error === 'ignore';
  const throwLastError = error === 'throwLastError';

  function call(...args: ARGS) {
    let finalError: any;
    let tasks = queue.splice(0)
    if (reversed) tasks = tasks.reverse();

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
  call.tapSilent = tap.silent;
  call.call = call;
  call.queue = queue;

  return call;
}