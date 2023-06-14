import { describe, expect, vi, it } from "vitest";
import { maybeAsync } from "./maybeAsync.js";

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

    await expect(promise1).rejects.toBe(mockError)
  });

  it('handle async function', async () => {
    const mockResult = { message: "It works!" }
    const promise1 = maybeAsync(async () => mockResult)

    expect(promise1.status).toBe("pending")
    expect(promise1.value).toBeUndefined()

    expect(await promise1).toBe(mockResult);
    expect(promise1.status).toBe("fulfilled")
    expect(promise1.value).toBe(mockResult);
  });

  it('handle async function + reject', async () => {
    const mockError = new Error()
    const promise1 = maybeAsync(async () => { throw mockError })

    expect(promise1.status).toBe("pending")
    expect(promise1.value).toBeUndefined()

    await expect(promise1).rejects.toBe(mockError)
    expect(promise1.status).toBe("rejected")
    expect(promise1.reason).toBe(mockError);
  });
});
