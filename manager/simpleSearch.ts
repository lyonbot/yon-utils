import { forEach } from "../type/iterable.js"

type FilterExFunction = {
  /** filter a list and get the sorted search result, with EXtra information. */
  <T, K>(items: Map<K, T>): { value: T; index: number; key: K, score: number }[]
  <T>(items: Iterable<T>): { value: T; index: number; key: string, score: number }[]
  <T extends Record<string, T>>(items: T): { value: T; index: number; key: string, score: number }[]
  (items: any): { value: any; index: number; key: any, score: number }[]
}

type FilterFunction = {
  /** filter a list and get the sorted search result. */
  <T, K>(items: Map<K, T>): T[]
  <T>(items: Iterable<T>): T[]
  <T extends Record<string, T>>(items: T): T[]
  (items: any): any[]
}

/**
 * Simple utility to start searching
 * 
 * @example
 * 
 * ```js
 * // note: items can be object / array / array of objects ...
 * const items = ['Alice', 'Lichee', 'Bob'];
 * 
 * const result = getSearchMatcher('lic').filter(items);
 * // -> ['Lichee', 'Alice']
 * ```
 */
export function getSearchMatcher(keyword: string) {
  /** turn things into a lowercase, accent-stripped string */
  const punctuationRe = /[\s\p{P}]+/u
  function normString(x: any): string {
    if (typeof x === 'string') return x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    if (typeof x === 'number') return String(x)
    if (x && typeof x === 'object') return Object.values(x).map(normString).join('\n')
    return ''
  }

  const kTokens = normString(keyword).split(punctuationRe).filter(Boolean);

  function test(record: any): number {
    const haystack = normString(record);

    // we must iterate through all tokens from haystack
    // so we can calculate the score and prioritize the result

    // for example: ['brat', 'dog'] 
    // - matches `og rat` with lower score
    // - matches `dog rat` with higher score
    // - matches `dog brat` with highest score

    let accurateHitBonus = 0; // a number between [0, 0xFFFFFFFF]
    for (let i = 0; i < kTokens.length; i++) {
      const k = kTokens[i];
      let lastPos = -1

      // try to search with `indexOf` for 3 times. maybe once it will hit a punctuation?
      for (let tryTime = 0; tryTime < 3; tryTime++) {
        lastPos = haystack.indexOf(k, lastPos + 1)
        if (lastPos === -1) {
          if (!tryTime) return 0; // not found the keyword in haystack
          break; // keyword token only appear once, which is acceptable.
        }

        if (i >= 31) {
          // this keyword token appears too late. will not contribute to the score
          break;
        }

        if (lastPos === 0 || punctuationRe.test(haystack.charAt(lastPos - 1))) {
          // this is an accurate hit, increase the score!
          accurateHitBonus += 0x40000000 >> i;
          break
        }
      }
    }

    return 1 + accurateHitBonus / 0x7FFFFFFF;
  }

  const filterEx: FilterExFunction = (items: any) => {
    const res: { value: any; index: number; key: any; score: number }[] = []

    const isArray = Array.isArray(items)
    let index = -1;

    forEach(items, (item, key) => {
      if (isArray) index = +key;
      else index += 1;

      const score = test(item)
      if (score) res.push({ value: item, score, index, key })
    })

    return res.sort((a, b) => b.score - a.score)
  }

  function filter<T>(items: Iterable<T>) {
    return filterEx(items).map(r => r.value)
  }

  return {
    /**
     * test one record and tell if it matches.
     * 
     * the `record` could be a string, array and object(only values will be tested).
     * 
     * will return `0` for not matched, `1` for fuzzy matched, `> 1` for partially accurately matched
     */
    test,

    /**
     * filter a list / collection, and get the sorted search result.
     * 
     * returns a similarity-sorted array of matched values.
     * 
     * also see `filterEx` if want more information
     */
    filter: filter as FilterFunction,

    /**
     * filter a list / collection, and get the sorted search result with extra information.
     * 
     * returns a similarity-sorted array of `{ value, score, index, key }`.
     * 
     * also see `filter` if you just want the values.
     */
    filterEx: filterEx as FilterExFunction,
  }
}
