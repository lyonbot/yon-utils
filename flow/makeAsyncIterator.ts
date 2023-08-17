/**
 * Help you convert a callback-style stream into an async iterator. Also works on "observable" value like RxJS.
 * 
 * You can think of this as a simplified `new Readable({ ... })` without headache.
 * 
 * @example
 * ```js
 * const iterator = makeAsyncIterator();
 * 
 * socket.on('data', value => iterator.write(value));
 * socket.on('end', () => iterator.end());
 * socket.on('error', (err) => iterator.end(err));
 * 
 * for await (const line of iterator) {
 *   console.log(line);
 * }
 * ```
 */
export function makeAsyncIterator<T>() {
  const onFeed: (() => void)[] = [];

  let done = false;
  const queue: (IteratorResult<T, any> | { error: any })[] = [];
  const push = (item: typeof queue[0]) => {
    if (done) {
      queue.length = 0;
      return; // already closed
    }

    queue.push(item);
    onFeed.splice(0).forEach(f => f());
  }

  const asyncIterator: { write(value: T): void; end(error?: any): void; } & AsyncIterableIterator<T> = {
    write(value) {
      push({ value, done: false });
    },
    end(error?: any) {
      push(error ? { error } : { done: true, value: undefined });
    },
    async next() {
      if (done) return { done: true, value: undefined }; // already closed

      // if queue is empty yet, wait for next result
      while (!queue.length) await new Promise<void>(resolve => onFeed.push(resolve));

      const ans = queue.shift()!;
      if ('error' in ans) { done = true; throw ans.error; }

      if (ans.done) done = true;
      return ans;
    },
    [Symbol.asyncIterator]() {
      return asyncIterator;
    },
  };

  return asyncIterator;
}
