import { describe, expect, it } from "vitest";
import { PromiseEx, PromisePendingError, makePromise, maybeAsync } from "./promise.js";
import { delay } from "./flow.js";

describe('maybeAsync', () => {
  it('handle sync function', async () => {
    const mockResult = { message: "It works!" }
    const promise1 = maybeAsync(() => mockResult)

    expect(promise1.status).toBe("fulfilled")
    expect(promise1.value).toBe(mockResult);

    expect(await promise1).toBe(mockResult);
  });

  it('handle sync function + throw', async () => {
    const mockError = new Error()
    const promise1 = maybeAsync(() => { throw mockError })

    expect(promise1.status).toBe("rejected")
    expect(promise1.reason).toBe(mockError);
    expect(() => promise1.value).toThrow()

    await expect(promise1).rejects.toBe(mockError)
  });

  it('handle async function', async () => {
    const mockResult = { message: "It works!" }
    const promise1 = maybeAsync(async () => mockResult)

    expect(promise1.status).toBe("pending")
    expect(promise1.loading).toBe(true)
    expect(() => promise1.value).toThrow(PromisePendingError)

    expect(await promise1).toBe(mockResult);
    expect(promise1.status).toBe("fulfilled")
    expect(promise1.loading).toBe(false)
    expect(promise1.value).toBe(mockResult);
  });

  it('handle async function + reject', async () => {
    const mockError = new Error()
    const promise1 = maybeAsync(async () => { throw mockError })

    expect(promise1.status).toBe("pending")
    expect(promise1.loading).toBe(true)
    expect(() => promise1.value).toThrow(PromisePendingError)

    await expect(promise1).rejects.toBe(mockError)
    expect(promise1.status).toBe("rejected")
    expect(promise1.reason).toBe(mockError);
    expect(promise1.loading).toBe(false)
    expect(() => promise1.value).toThrow(mockError)
  });

  it('handle nested promise', async () => {
    const promise0 = Promise.resolve(24);
    const promise1 = maybeAsync(async () => { return promise0 })

    expect(promise1.status).toBe("pending")
    expect(() => promise1.value).toThrow(PromisePendingError)

    expect(await promise1).toBe(24);
    expect(promise1.status).toBe("fulfilled")
    expect(promise1.value).toBe(24);
  })
});

describe('PromiseEx', () => {
  it('constructor: inherit from a PromiseEx', async () => {
    const promise1 = new PromiseEx(res => res(PromiseEx.resolve(123)))
    expect(promise1.value).toBe(123)  // fulfilled

    const promise2 = new PromiseEx(res => res(PromiseEx.reject('rej')))
    expect(promise2.reason).toBe('rej')  // rejected
    await expect(promise2).rejects.toThrow()
  })

  it('thenImmediately', async () => {
    const promise1 = PromiseEx.resolve(1)
    const promise2 = promise1.thenImmediately(v => v * 2)

    expect(promise2.status).toBe('fulfilled')
    expect(promise2.value).toBe(2)

    const promise3 = promise1.thenImmediately(() => { throw "failure" })
    expect(promise3.status).toBe('rejected')
    expect(promise3.reason).toBe("failure")
    expect(() => promise3.value).toThrow("failure")

    const promise4 = promise3.thenImmediately(null, (errTxt: string) => `Meet Error: ${errTxt}`)
    expect(promise4.status).toBe('fulfilled')
    expect(promise4.value).toBe('Meet Error: failure')

    const promise5 = promise3.thenImmediately(x => x) // no onrejected
    expect(promise5.status).toBe('rejected')
    expect(promise5.reason).toBe('failure')
    await expect(promise5).rejects.toThrow()  // consume the rejection so NodeJS will not crash
  })

  it('thenImmediately + async', async () => {
    // Promise.resolve always returns a pending Promise
    const base = PromiseEx.resolve(Promise.resolve(100))
    expect(base.status).toBe('pending')

    const promise1 = base.thenImmediately(val => `it's ${val}`)
    expect(promise1.status).toBe('pending')

    expect(await promise1).toBe("it's 100")
    expect(base.status).toBe('fulfilled')
    expect(promise1.status).toBe('fulfilled')
  })

  it('wait', async () => {
    await PromiseEx.resolve(delay(200)).wait(300)
    await PromiseEx.resolve(delay(200)).wait(-1)
    await expect(PromiseEx.resolve(delay(200)).wait(100)).rejects.toThrowError(PromisePendingError)
  })
})

describe('makePromise', () => {
  it('works', async () => {
    const promise = makePromise<number>()

    expect(promise.status).toBe('pending')

    promise.resolve(100)
    expect(promise.status).toBe('fulfilled')
    expect(promise.value).toBe(100)
  })

  it('works2', async () => {
    const promise = makePromise<number>()

    expect(promise.status).toBe('pending')

    promise.reject('bad boy')
    expect(promise.status).toBe('rejected')
    expect(() => promise.value).toThrow('bad boy')
  })
})
