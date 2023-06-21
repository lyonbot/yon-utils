import { Fn, Falsy } from "../type/types.js";

/**
 * @example
 * 
 * With `fnQueue`, you can implement a simple disposer to avoid resource leaking.
 * 
 * ```js
 * const onDispose = fnQueue();
 * try {
 *   const srcFile = await openFile(path1);
 *   onDispose.tap(() => srcFile.close());
 * 
 *   const dstFile = await openFile(path2);
 *   opDispose.tap(() => dstFile.close());
 * 
 *   await copyData(srcFile, dstFile);
 * } finally {
 *   onDispose.call(); // close handles
 *   
 *   onDispose.call(); // nothing happens -- the queue is emptied
 * }
 * ```
 */
export function fnQueue<ARGS extends any[] = any[]>() {
  const queue = [] as Fn<any, ARGS>[];
  return {
    /** add callbacks into the queue */
    tap(...fns: (Fn<any, ARGS> | Falsy)[]) {
      queue.push(...fns.filter(f => f && typeof f === 'function') as Fn[]);
    },
    
    /** invoke all callbacks and clear the queue */
    call(...args: ARGS) {
      queue.splice(0).forEach(fn => fn(...args));
    },

    /** the array of all tapped callbacks */
    queue,
  }
}