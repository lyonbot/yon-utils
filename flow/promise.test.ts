import { describe, expect, it } from "vitest";
import { PromiseEx, PromisePendingError, maybeAsync } from "./promise.js";

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
    expect(() => promise1.value).toThrow(PromisePendingError)

    expect(await promise1).toBe(mockResult);
    expect(promise1.status).toBe("fulfilled")
    expect(promise1.value).toBe(mockResult);
  });

  it('handle async function + reject', async () => {
    const mockError = new Error()
    const promise1 = maybeAsync(async () => { throw mockError })

    expect(promise1.status).toBe("pending")
    expect(() => promise1.value).toThrow(PromisePendingError)

    await expect(promise1).rejects.toBe(mockError)
    expect(promise1.status).toBe("rejected")
    expect(promise1.reason).toBe(mockError);
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
  })
})
