import { Nil } from "./types.js";

export type OneOrMany<T> = Iterable<T | Nil> | T | Nil

/**
 * Input anything, always return an array.
 * 
 * - If the input is a single value that is not an array, wrap it as a new array.
 * - If the input is already an array, it returns a shallow copy.
 * - If the input is an iterator, it is equivalent to using `Array.from()` to process it.
 * 
 * Finally before returning, all `null` and `undefined` will be omitted
 */
export function toArray<T>(value: OneOrMany<T>) {
  if (!Array.isArray(value)) {
    if (!!value && typeof value === 'object' && Symbol.iterator in value) value = Array.from(value);
    else value = [value];
  }
  return (value as T[]).filter(x => x != null)
}

export type Predicate<T> = (value: T, index: number) => boolean;

/**
 * Like `Array#find`, but the input could be a Iterator (for example, from generator, `Set` or `Map`)
 */
export function find<T>(iterator: Iterable<T> | Nil, predicate: Predicate<T>): T | undefined {
  if (!iterator) return;

  let index = 0;
  for (const item of iterator) {
    if (predicate(item, index)) return item;
    index += 1;
  }
}

/**
 * Like `Array#reduce`, but the input could be a Iterator (for example, from generator, `Set` or `Map`)
 */
export function reduce<T, U>(iterator: Iterable<T> | Nil, initial: U, reducer: (agg: U, item: T, index: number) => U): U {
  if (!iterator) return initial;

  let index = 0;
  let agg = initial;
  for (const item of iterator) {
    agg = reducer(agg, item, index);
    index += 1;
  }

  return agg;
}

/**
 * Take the first result from a Iterator
 */
export function head<T>(iterator: Iterable<T> | Nil): T | undefined {
  if (!iterator) return;

  const it = iterator[Symbol.iterator]();
  return it.next().value;
}

export type CollectionOf<T> =
  | ReadonlyArray<T>
  | Set<T> | Map<T, any>
  | (T extends object ? WeakMap<T, any> | WeakSet<T> : never)
  | (T extends string ? Record<T, any> : never)

/**
 * input an array / Set / Map / WeakSet / WeakMap / object etc, check if it contains the `item`
 */
export function contains<T>(collection: CollectionOf<T> | Nil, item: T): boolean {
  if (!collection) return false;
  if (Array.isArray(collection)) return collection.includes(item);
  if ('has' in collection && typeof collection.has === 'function') return collection.has(item);
  return Object.hasOwnProperty.call(collection, String(item));
}

/**
 * a simple forEach iterator that support both `Array | Set | Map | Object | Iterable` as the input
 * 
 * when met plain object, it works like `forIn` of lodash.
 */
export function forEach<K, V>(objOrArray: Map<K, V>, iter: (value: V, key: K, whole: Map<K, V>) => void): void;
export function forEach<T extends Iterable<any>>(objOrArray: T, iter: (value: IterItem<T>, key: number, whole: T) => void): void;
export function forEach<U extends Record<any, any>>(objOrArray: U, iter: (value: U[keyof U], key: keyof U, whole: U) => void): void;
export function forEach(objOrArray: any, iter: (value: any, key: any, whole: any) => void): void {
  if (!objOrArray || typeof objOrArray !== 'object') return;
  if (Array.isArray(objOrArray) || objOrArray instanceof Map) return objOrArray.forEach(iter);
  if (Symbol.iterator in objOrArray) {
    let index = 0;
    for (const iterator of (objOrArray as any)) iter(iterator, index++, objOrArray)
    return
  }
  for (const k of Object.keys(objOrArray)) {
    iter(objOrArray[k], k, objOrArray);
  }
}

export type IterItem<T> = T extends Iterable<infer U> ? U : never;
