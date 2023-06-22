import { describe, expect, it } from "vitest";
import { newFunction } from "./function.js";

describe("newFunction", () => {
  it("should generate a function that returns the sum of two numbers", () => {
    const add = newFunction(["a", "b"], "return a + b");
    expect(add(2, 3)).toBe(5);
    expect(add(-10, 30)).toBe(20);
  });

  it("should generate an async function", async () => {
    const delay = newFunction(
      ["ms"],
      "await new Promise(resolve => setTimeout(resolve, ms))",
      { async: true }
    );
    const start = Date.now();
    await delay(200);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(200);
  });

  it("should throw an error if the code contains syntax errors", () => {
    const invalidCode = () => newFunction([], "this is not valid code");
    expect(invalidCode).toThrow(SyntaxError);
  });

  it("should support default options", () => {
    const value = newFunction([], "return 42", { async: true });
    expect(value()).resolves.toBe(42);
  });

  it("should accept custom function types", () => {
    const multiply = newFunction<string, [a: number, b: number]>(["a", "b"], "return 'it is ' + (a * b)", {});

    expect(multiply(3, 4)).toBe('it is 12');

    //@ts-expect-error - argument "b" is numbers
    multiply(3, 'not-number')

    //@ts-expect-error - 2 arguments
    multiply(3)

    //@ts-expect-error - return type is string
    const temp1: number = multiply(3, 4)
  });
});
