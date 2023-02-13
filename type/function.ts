type UnknownArray<ArgNames extends any[]>
  = number extends ArgNames['length'] ? any[]
  : ArgNames extends [] ? []
  : ArgNames extends [any, ...infer R] ? [any, ...UnknownArray<R>]
  : any[];
type GeneratedFunction<ArgNames extends any[], Result = any> = (...args: UnknownArray<ArgNames>) => Result;

/**
 * like `new Function` but with more reasonable options and api
 */
export function newFunction<
  ArgNames extends string[] = string[],
  Fn extends GeneratedFunction<ArgNames> = GeneratedFunction<ArgNames>
>(
  args: ArgNames,
  code: string,
  options?: {
    /** set to `true` if the code contains `await`, the new function will be an async function */
    async?: boolean
  },
) {
  if (!options) options = {};
  if (options.async) code = `return (async()=>{\n${code}\n})()`;

  // -----------------------------------

  const fn = new Function(...args, code) as Fn;
  return fn;
}
