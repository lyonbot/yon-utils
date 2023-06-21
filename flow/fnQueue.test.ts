import { describe, expect, test, vitest as jest } from "vitest";
import { fnQueue } from './fnQueue.js';

describe('fnQueue', () => {
  test('tap method adds callbacks into the queue', () => {
    const queue = fnQueue();

    const fn1 = jest.fn();
    const fn2 = jest.fn();

    queue.tap(fn1);
    expect(queue.queue).toContain(fn1);

    queue.tap(fn2);
    expect(queue.queue).toContain(fn1);
    expect(queue.queue).toContain(fn2);
  });

  test('call method invokes all callbacks and clears the queue', () => {
    const queue = fnQueue();

    const fn1 = jest.fn();
    const fn2 = jest.fn();

    queue.tap(fn1, fn2);

    queue.call("hello");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn1).toBeCalledWith("hello");
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn2).toBeCalledWith("hello");
    expect(queue.queue).toHaveLength(0);

    queue.call("world");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  test('queue method returns the array of all tapped callbacks', () => {
    const queue = fnQueue();

    const fn1 = jest.fn();
    const fn2 = jest.fn();

    queue.tap(fn1, fn2);

    expect(queue.queue).toEqual([fn1, fn2]);
  });

  test('tap method throws if non-function argument is passed', () => {
    const queue = fnQueue();

    // @ts-expect-error
    queue.tap(undefined)
    // @ts-expect-error
    queue.tap(null)
    // @ts-expect-error
    queue.tap('invalid')
    // @ts-expect-error
    queue.tap(42)
    // @ts-expect-error
    queue.tap({})
    // @ts-expect-error
    queue.tap([])

    expect(queue.queue).toHaveLength(0);
  });

});
