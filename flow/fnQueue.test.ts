import { describe, expect, test, vitest as jest, it } from "vitest";
import { fnQueue } from './fnQueue.js';

describe('fnQueue', () => {
  test.each([
    { reversed: false, output: [1, 2] },
    { reversed: true, output: [2, 1] },
  ])('basic %', (testcase) => {
    const queue = fnQueue<[arg0: string]>(false, testcase.reversed);
    const print = [] as number[];

    const fn1 = jest.fn(() => print.push(1));
    const fn2 = jest.fn(() => print.push(2));

    queue.tap(fn1, fn2, null, {} as any);

    queue.call("hello");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn1).toBeCalledWith("hello");
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn2).toBeCalledWith("hello");
    expect(queue.queue).toHaveLength(0);
    expect(print).toEqual(testcase.output);

    // @ts-expect-error
    queue.call("world", 123);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it.each([
    { reversed: false, output: [1] },
    { reversed: true, output: [3] },
    { silent: true, output: [1, 3] },
  ])('async fn with one throws %', async (testcase) => {
    const queue = fnQueue(true, testcase.reversed);
    const print = [] as number[];

    const fn1 = jest.fn(async () => print.push(1));
    const fn2 = jest.fn(async () => { throw new Error('error2') });
    const fn3 = jest.fn(async () => print.push(3));

    if (testcase.silent) queue.tapSilent(fn1, fn2, fn3);
    else queue.tap(fn1, fn2, fn3);

    const result = queue();

    if (testcase.silent) await expect(result).resolves.toBeUndefined();
    else await expect(result).rejects.toThrow('error2');

    expect(print).toEqual(testcase.output);
    expect(queue.queue).toHaveLength(0);
  });
});
