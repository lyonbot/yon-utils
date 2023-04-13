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
 * socket.on('end', value => iterator.end());
 * 
 * for await (const line of iterator) {
 *   console.log(line);
 * }
 * ```
 */
export function makeAsyncIterator<T>() {
  const onFeed: (() => void)[] = [];

  let done = false;
  const queue: IteratorResult<T, any>[] = [];

  const x: { write(value: T): void; end(): void; } & AsyncIterableIterator<T> = {
    write(value) {
      if (done) {
        queue.length = 0;
        return; // already closed
      }

      queue.push({ value, done: false });
      onFeed.splice(0).forEach(f => f());
    },
    end() {
      queue.push({ done: true, value: undefined });
    },
    async next() {
      if (done) return { done: true, value: undefined }; // already closed

      while (!queue.length) await new Promise<void>(resolve => onFeed.push(resolve));
      const ans = queue.shift()!;
      if (ans.done) done = true;

      return ans;
    },
    [Symbol.asyncIterator]() {
      return x;
    },
  };

  return x;
}
