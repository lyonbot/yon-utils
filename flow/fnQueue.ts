import { Fn, Falsy } from "../type/types.js";

type FnQueue<ARGS extends any[] = any[], RET = void> = {
  (...args: ARGS): RET

  /** add functions to queue */
  tap: (...fns: (Fn<any, ARGS> | Falsy)[]) => void;

  /** add functions to queue, but silently ignore their errors */
  tapSilent: (...fns: (Fn<any, ARGS> | Falsy)[]) => void;

  call: (...args: ARGS) => RET;
  queue: { silent?: boolean; fn: Fn<any, ARGS> }[];
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
 * @param isAsync - if true, all queued functions are treated as async, and we return a Promise in the end.
 * @param reversed - if true, the order of execution is reversed (FILO, like a stack)
 */
export function fnQueue<ARGS extends any[] = any[]>(isAsync: true, reversed?: boolean): FnQueue<ARGS, Promise<void>>
export function fnQueue<ARGS extends any[] = any[]>(isAsync?: boolean, reversed?: boolean): FnQueue<ARGS, void>
export function fnQueue<ARGS extends any[] = any[]>(isAsync?: boolean, reversed?: boolean): FnQueue<ARGS> {
  type F = Fn<any, ARGS>
  const queue = [] as FnQueue<ARGS>['queue'];

  function call(...args: ARGS) {
    let tasks = queue.splice(0)
    if (reversed) tasks = tasks.reverse();

    if (isAsync) {
      const shift = (p: Promise<void>): Promise<void> => tasks.length
        ? p.then(() => {
          const task = tasks.shift()!;
          let p0 = p.then(() => task.fn(...args));
          if (task.silent) p0 = p0.catch(() => void 0);
          return p0.then(() => shift(p));
        })
        : p;
      return shift(Promise.resolve());
    }

    tasks.forEach(fn => fn.fn(...args));
  }
  call.tap = function (...fns: (F | Falsy)[]) {
    queue.push(...(fns.filter(f => f && typeof f === 'function') as Fn[]).map(fn => ({ fn })));
  }
  call.tapSilent = function (...fns: (F | Falsy)[]) {
    queue.push(...(fns.filter(f => f && typeof f === 'function') as Fn[]).map(fn => ({ fn, silent: true })));
  }
  call.call = call;
  call.queue = queue;

  return call;
}