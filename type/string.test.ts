import { describe, expect, it } from "vitest";
import { getVariableName } from "./string.js";

describe('getVariableName', () => {
  it('works', () => {
    expect(getVariableName('foo-bar')).toBe("fooBar")
    expect(getVariableName('123abc')).toBe("_123abc")
    expect(getVariableName('')).toBe("foobar")
    expect(getVariableName('name', ['name', 'age'])).toBe("name2")
  })
})