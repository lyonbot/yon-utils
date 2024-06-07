import { shallowEqual } from "../type/compare.js";

/**
 * Wrap `fn` and create an unary function. The actual `fn()` executes only when the argument changes.
 * 
 * Meanwhile, your `fn` may return a cleanup function, which will be invoked before new `fn()` calls
 * -- just like React's `useEffect`
 * 
 * The new unary function also provide `cleanup()` method to forcedly do the cleanup, which will also clean the memory of last input.
 * 
 * @example
 * ```js
 * const sayHi = makeEffect((name) => {
 *   console.log(`Hello, ${name}`);
 *   return () => {
 *     console.log(`Goodbye, ${name}`);
 *   }
 * });
 * 
 * sayHi('Alice');  // output: Hello, Alice
 * sayHi('Alice');  // no output
 * sayHi('Bob');    // output: Goodbye, Alice   Hello, Bob
 * sayHi.cleanup(); // output: Goodbye, Bob
 * sayHi.cleanup(); // no output
 * ```
 */
export function makeEffect<T>(
  fn: (input: T, previous: T | undefined) => void | (() => void),
  isEqual: (x: T, y: T) => boolean = shallowEqual,
) {
  let lastInput: T | undefined = undefined;
  let lastCleanupFn: void | (() => void) = undefined;

  const doCleanup = () => {
    lastInput = undefined;
    if (typeof lastCleanupFn === 'function') lastCleanupFn();
    lastCleanupFn = undefined;
  };

  const unaryFn = (input: T) => {
    const changed = lastInput === undefined || !isEqual(input, lastInput);
    if (changed) {
      const last = lastInput;  // avoid getting forget by `doCleanup`
      doCleanup();
      lastInput = input;
      lastCleanupFn = fn(input, last);
    }
  };

  /** invoke last cleanup callback, and forget the last input */
  unaryFn.cleanup = doCleanup;
  Object.defineProperty(unaryFn, 'value', { enumerable: true, get: () => lastInput })

  return unaryFn as {
    /** check whether value changed. if so, invoke last cleanup function, update `value` and remember new cleanup function */
    (input: T): void;
    /** invoke last cleanup function, and reset `value` to undefined */
    cleanup(): void;
    /** get last received value, or `undefined` if effect was clean up */
    readonly value: T | undefined;
  };
}
