import { Fn } from "./types.js";

type ArgumentNameArray<ARGS, AGG extends any[]> =
  | ARGS extends [] ? AGG
  : ARGS extends [any, ...infer REST] ? ArgumentNameArray<REST, [...AGG, string]>
  : string[]

type NameArray<ARGS> = {} & ArgumentNameArray<ARGS, []>

/**
 * like `new Function` but with more reasonable options and api
 * 
 * @param argumentNames - a `string[]` of argument names
 * @param functionBody - the function body
 */
export function newFunction<RESULT = any, ARGS extends any[] = any[]>(
  argumentNames: NameArray<ARGS>,
  functionBody: string,
  options?: {
    /** set to `true` if the code contains `await`, the new function will be an async function */
    async?: boolean
  },
) {
  if (!options) options = {};
  if (options.async) functionBody = `return (async()=>{\n${functionBody}\n})()`;

  // -----------------------------------

  const fn = new Function(...argumentNames, functionBody) as Fn<RESULT, ARGS>;
  return fn;
}

export const noop = (): void => {};
