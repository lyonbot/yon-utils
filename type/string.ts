import { CollectionOf, contains } from "./iterable";

/**
 * Quickly compute string hash with [cyrb53 algorithm](https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js)
 */
export function stringHash(str: string) {
  str = String(str)
  const seed = 0;
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch: number; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * input anything weird, get a valid variable name
 *
 * optionally, you can give a `existingVariables` to avoid conflicting -- the new name might have a numeric suffix
 * 
 * @example
 * ```js
 * getVariableName('foo-bar')   // -> "fooBar"
 * getVariableName('123abc')    // -> "_123abc"
 * getVariableName('')          // -> "foobar"
 * getVariableName('name', ['name', 'age'])    // -> "name2"
 * ```
 */
export function getVariableName(basicName: string, existingVariables?: CollectionOf<string>) {
  // remove anything except \w and Chinese characters
  let tmp = basicName.replace(
    /[^\w$\u3000\u3400-\u4DBF\u4E00-\u9FFF]+([\w$\u3000\u3400-\u4DBF\u4E00-\u9FFF]?)/g,
    (_, x) => x.toUpperCase(),
  );
  if (!tmp) tmp = 'foobar';
  tmp = tmp[0]!.toLowerCase() + tmp.substr(1);
  if (/^\d/.test(tmp)) tmp = `_${tmp}`;

  // avoid conflicting
  if (existingVariables) {
    if (contains(existingVariables, tmp)) {
      let suffix = 2;
      while (contains(existingVariables, tmp + suffix)) suffix += 1;
      tmp = tmp + suffix;
    }
  }

  return tmp;
}
