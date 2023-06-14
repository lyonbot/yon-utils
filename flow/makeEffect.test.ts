import { describe, expect, vi, it } from "vitest";
import { makeEffect } from "./makeEffect.js";

describe('makeEffect', () => {
  it('works', async () => {
    const mockOutputs = [] as string[];
    const getMockOutputs = () => mockOutputs.splice(0);  // get mock outputs and reset buffer

    // ----------------------------------------------------------------

    const sayHi = makeEffect((name) => {
      // console.log(`Hello, ${name}`);
      mockOutputs.push(`Hello, ${name}`);

      return () => {
        // console.log(`Goodbye, ${name}`);
        mockOutputs.push(`Goodbye, ${name}`);
      }
    });

    sayHi('Alice');  // output: Hello, Alice
    expect(getMockOutputs()).toEqual([
      'Hello, Alice'
    ])

    sayHi('Alice');  // no output -- the effect fn is suppressed
    expect(getMockOutputs()).toEqual([
    ])

    sayHi('Bob');    // output: Goodbye, Alice   Hello, Bob
    expect(getMockOutputs()).toEqual([
      'Goodbye, Alice',
      'Hello, Bob',
    ])

    sayHi.cleanup(); // output: Goodbye, Bob
    expect(getMockOutputs()).toEqual([
      'Goodbye, Bob',
    ])

    sayHi.cleanup(); // no output
    expect(mockOutputs.splice(0)).toEqual([
    ])
  })
})