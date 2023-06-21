/** TypeScript type presents all falsy value, including Nil, false, 0, "" */
export type Falsy = null | undefined | false | 0 | "";

/** TypeScript type presents null or undefined */
export type Nil = null | undefined;

/** TypeScript type presents any function */
export type Fn<RET = any, ARGS extends any[] = any[]> = (...args: ARGS) => RET;

/** Tell if `obj` is null or undefined */
export function isNil(obj: any): obj is Nil {
  return obj == null
}
