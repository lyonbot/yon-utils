import { describe, expect, test, vitest as jest } from "vitest";
import { withDefer, withAsyncDefer } from './withDefer.js';

describe('withDefer', () => {
  test('works', () => {
    const disposeFn1 = jest.fn()
    const disposeFn2 = jest.fn()

    const result = withDefer(defer => {
      defer(disposeFn1)
      defer(disposeFn2)
      defer(disposeFn2)

      return 123
    })

    expect(result).toEqual(123)
    expect(disposeFn1).toBeCalledTimes(1)
    expect(disposeFn2).toBeCalledTimes(2)
  })

  test('works even if main throws', () => {
    const disposeFn1 = jest.fn()
    const disposeFn2 = jest.fn()

    expect(() => withDefer(defer => {
      defer(disposeFn1)
      defer(disposeFn2)

      throw new Error('main')
    })).toThrowError('main')

    expect(disposeFn1).toBeCalledTimes(1)
    expect(disposeFn2).toBeCalledTimes(1)
  })

  test('all disposeFn are called even if they throws', () => {
    const disposeFn1 = jest.fn(() => { throw new Error('disposeFn1') })
    const disposeFn2 = jest.fn(() => { throw new Error('disposeFn2') })
    const disposeFn3 = jest.fn()

    expect(() => withDefer(defer => {
      defer(disposeFn1)
      defer(disposeFn1) // 2x times

      defer(disposeFn2)
      defer(disposeFn3)

      throw new Error('main')
    })).toThrowError('disposeFn2') // <- last error from disposeFn2

    expect(disposeFn1).toBeCalledTimes(2)
    expect(disposeFn2).toBeCalledTimes(1)
    expect(disposeFn3).toBeCalledTimes(1)
  })
});

describe('withAsyncDefer', () => {
  test('works', async () => {
    const disposeFn1 = jest.fn()
    const disposeFn2 = jest.fn()

    const result = await withAsyncDefer(async defer => {
      defer(disposeFn1)
      defer(disposeFn2)

      return 123
    })

    expect(result).toEqual(123)
    expect(disposeFn1).toBeCalledTimes(1)
    expect(disposeFn2).toBeCalledTimes(1)
  })

  test('works even if main throws', async () => {
    const disposeFn1 = jest.fn()
    const disposeFn2 = jest.fn()

    await expect(() => withAsyncDefer(async defer => {
      defer(disposeFn1)
      defer(disposeFn2)

      throw new Error('main')
    })).rejects.toThrowError('main')

    expect(disposeFn1).toBeCalledTimes(1)
    expect(disposeFn2).toBeCalledTimes(1)
  })

  test('all disposeFn are called even if they throws', async () => {
    const disposeFn1 = jest.fn(() => { throw new Error('disposeFn1') })
    const disposeFn2 = jest.fn(async () => { throw new Error('disposeFn2') })
    const disposeFn3 = jest.fn()

    await expect(() => withAsyncDefer(async defer => {
      defer(disposeFn1)
      defer(disposeFn1) // 2x times

      defer(disposeFn2)
      defer(disposeFn3)

      throw new Error('main')
    })).rejects.toThrowError('disposeFn2') // <- last error from disposeFn2

    expect(disposeFn1).toBeCalledTimes(2)
    expect(disposeFn2).toBeCalledTimes(1)
    expect(disposeFn3).toBeCalledTimes(1)
  })
});
