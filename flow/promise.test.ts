import { describe, expect, it } from "vitest";
import { PromisePendingError, maybeAsync } from "./promise.js";

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
});
