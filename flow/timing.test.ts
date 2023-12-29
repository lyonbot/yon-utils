import { describe, expect, test, vitest as jest, afterEach, afterAll } from "vitest";
import { timing } from './timing.js';

describe('timing', () => {
  const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

  afterEach(() => void consoleLog.mockClear())
  afterAll(() => void consoleLog.mockReset());

  test('works with sync functions', () => {
    timing.defaultPrint = undefined; // reset

    expect(timing('sync1', () => 1)).toBe(1)
    expect(() => timing('sync2', () => { throw new Error('fail2') })).toThrow('fail2')

    expect(consoleLog).toBeCalledTimes(2)
  });

  test('works with asynchronous function', async () => {
    timing.defaultPrint = undefined; // reset

    await expect(timing('async1', async () => 1)).resolves.toBe(1)
    await expect(timing('async2', async () => { await Promise.resolve(); throw new Error('fail2') })).rejects.toThrow('fail2')

    await expect(timing('async3', Promise.resolve(1))).resolves.toBe(1)
    await expect(timing('async4', Promise.reject(new Error('fail4')))).rejects.toThrow('fail4')

    expect(consoleLog).toBeCalledTimes(4)
  });

  test('works on custom logger', async () => {
    const print = jest.fn()
    timing(print, () => 1234)

    expect(print).toBeCalledTimes(1)
    expect(print).toBeCalledWith(expect.any(Number), expect.any(Number))
  })

  test('works on custom logger (globally)', async () => {
    const print = jest.fn()
    timing.defaultPrint = print // set as global

    timing('hello', () => 1234)

    expect(print).toBeCalledTimes(1)
    expect(print).toBeCalledWith('hello', expect.any(Number), expect.any(Number))

    timing.defaultPrint = undefined // reset
  })
});
