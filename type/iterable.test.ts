import { describe, expect, it } from "vitest";
import { toArray } from "./iterable.js";

describe("toArray", () => {
  it("should convert a single value to an array", () => {
    expect(toArray(42)).toEqual([42]);
    expect(toArray('hello')).toEqual(['hello']);
    expect(toArray({ length: 0 })).toEqual([{ length: 0 }]);

    expect(toArray(0)).toEqual([0]);
    expect(toArray(false)).toEqual([false]);
    expect(toArray('')).toEqual(['']);
  });

  it("should filter out null and undefined values", () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);

    const arr = [1, null, undefined, 2, undefined, 3];
    const result = toArray(arr);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should convert an iterator object to an array", () => {
    const set = new Set(['foo', 'bar']);
    expect(toArray(set)).toEqual(['foo', 'bar']);
    expect(toArray(set.values())).toEqual(['foo', 'bar']);
  });

  it("should preserve arrays", () => {
    const arr = [1, 2, 3];
    const result = toArray(arr);
    expect(result).toEqual([1, 2, 3]);
  });
});
