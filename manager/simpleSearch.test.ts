import { describe, expect, vi, it } from "vitest";
import { getSearchMatcher } from "./simpleSearch.js";

describe('simpleSearch', () => {
  it('works', async () => {
    const items = ['Alice', 'Líchee', 'Bob', 'alice'];
    const matcher = getSearchMatcher('lic');

    const result = matcher.filter(items);
    expect(result).toEqual(['Líchee', 'Alice', 'alice'])

    const resultEx = matcher.filterEx(items);
    expect(resultEx).toEqual([
      { index: 1, item: "Líchee", key: 1, score: expect.any(Number) },
      { index: 0, item: "Alice", key: 0, score: 1 },
      { index: 3, item: "alice", key: 3, score: 1 },
    ])
    expect(resultEx[0].index).gte(1)
  });

  it('search in object', async () => {
    const items = [
      { name: 'Alice', age: 28 },
      { name: 'Bob', age: 25 },
      { name: 'Charlotte', age: 29 },
    ]

    const result1 = getSearchMatcher('29').filter(items);
    expect(result1).toEqual([{ name: 'Charlotte', age: 29 }])

    const result2 = getSearchMatcher('C').filter(items);
    expect(result2).toEqual([{ name: 'Charlotte', age: 29 }, { name: 'Alice', age: 28 }])
  })
});