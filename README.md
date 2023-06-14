# yon-utils

Some utils that I repeated too many times. DRY!

All modules are shipped as ES modules and tree-shakable.

- via package manager

  `npm install yon-utils`

- via import within `<script type="module">`

  `import { elt } from "https://unpkg.com/yon-utils"`

<!-- auto generate begin -->



## ToC

| module | methods |
|---------|:--------|
| dom | [writeClipboard](#fn-writeClipboard) / [readClipboard](#fn-readClipboard) / [clsx](#fn-clsx) / [elt](#fn-elt) / [startMouseMove](#fn-startMouseMove) |
| flow | [fnQueue](#fn-fnQueue) / [makeAsyncIterator](#fn-makeAsyncIterator) / [makeEffect](#fn-makeEffect) / [maybeAsync](#fn-maybeAsync) / [delay](#fn-delay) / [makePromise](#fn-makePromise) / [debouncePromise](#fn-debouncePromise) |
| type | [is](#fn-is) / [shallowEqual](#fn-shallowEqual) / [newFunction](#fn-newFunction) / [toArray](#fn-toArray) / [find](#fn-find) / [reduce](#fn-reduce) / [head](#fn-head) / [contains](#fn-contains) / [forEach](#fn-forEach) / [stringHash](#fn-stringHash) / [getVariableName](#fn-getVariableName) |

<br />

## 🧩 dom/clipboard

<a id="fn-writeClipboard"></a>
### `writeClipboard(text)`

- **text**: `string` 

- Returns: `Promise<void>` 

write text to clipboard, with support for insecure context and legacy browser!

note: if you are in HTTPS and modern browser, you can directly use `navigator.clipboard.writeText()` instead.

<a id="fn-readClipboard"></a>
### `readClipboard(timeout?)`

- **timeout**: `number` — default 1500

- Returns: `Promise<string>` 

read clipboard text.

if user rejects or hesitates about the permission for too long,
this will throw an Error.

<br />

## 🧩 dom/clsx

<a id="fn-clsx"></a>
### `clsx(...args)`

- **args**: `any[]` 

- Returns: `string` 

construct className strings conditionally.

can be an alternative to `classnames()`. modified from [lukeed/clsx](https://github.com/lukeed/clsx). to integrate with Tailwind VSCode, [read this](https://github.com/lukeed/clsx#tailwind-support)

<br />

## 🧩 dom/elt

<a id="fn-elt"></a>
### `elt(tagName, attrs, ...children)`

- **tagName**: `string` — for example `"div"`

- **attrs**: `any` — attribute values to be set. beware:
  - `onClick` and a `function` value, will be handled by `addEventListener()`
  - `!onClick` or `onClick.capture` will make it capture
  - `style` supports passing in an object
  - `class` value will be process by `clsx()`
  - `className` is alias of `class`

- **children**: `any[]` — can be strings, numbers, nodes. other types or nils will be omitted.

- Returns: `HTMLElement` 

Make `document.createElement` easier

```js
var button = elt('button', { class: 'myButton', onclick: () => alert('hi') }, 'Click Me!')
```

This function can be used as a [jsxFactory](https://www.typescriptlang.org/tsconfig#jsxFactory), aka [JSX pragma](https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/).
You can add <code>/** &#64;jsx elt *&#47;</code> into your code, then TypeScript / Babel will use `elt` to process JSX expressions:

> /** &#64;jsx elt *&#47;
>
> var button = &lt;button class="myButton" onclick={...}>Click Me&lt;/button></code></pre>

<br />

## 🧩 dom/mouseMove

<a id="fn-startMouseMove"></a>
### `startMouseMove({ initialEvent, onMove, onEnd })`

- **__0**: `MouseMoveInitOptions` 
  - **initialEvent**: `MouseEvent | PointerEvent` 
  
  - **onMove**: `((data: MouseMoveInfo) => void) | undefined` 
  
  - **onEnd**: `((data: MouseMoveInfo) => void) | undefined` 

- Returns: `Promise<MouseMoveInfo>` — - the final position when user releases button

use this in `mousedown` or `pointerdown`

and it will keep tracking the cursor's movement, calling your `onMove(...)`, until user releases the button.

(not support ❌ `touchstart` -- use ✅ `pointerdown` instead)

#### Example

```js
button.addEventListener('pointerdown', event => {
  event.preventDefault();
  startMouseMove({
    initialEvent: event,
    onMove({ deltaX, deltaY }) { ... },
    onEnd({ deltaX, deltaY }) { ... },
  });
});
```

<br />

## 🧩 flow/fnQueue

<a id="fn-fnQueue"></a>
### `fnQueue()`

- Returns: `{ tap, call, queue }` 
  - **tap**: `(...fns: Fn[]) => void` — add callbacks into the queue
  
  - **call**: `(...args: ARGS) => void` — invoke all callbacks and clear the queue
  
  - **queue**: `Fn[]` — the array of all tapped callbacks

#### Example

With `fnQueue`, you can implement a simple disposer to avoid resource leaking.

```js
const onDispose = fnQueue();
try {
  const srcFile = await openFile(path1);
  onDispose.tap(() => srcFile.close());

  const dstFile = await openFile(path2);
  opDispose.tap(() => dstFile.close());

  await copyData(srcFile, dstFile);
} finally {
  onDispose.call(); // close handles
  
  onDispose.call(); // nothing happens -- the queue is emptied
}
```

<br />

## 🧩 flow/makeAsyncIterator

<a id="fn-makeAsyncIterator"></a>
### `makeAsyncIterator()`

- Returns: `{ write(value: T): void; end(): void; } & AsyncIterableIterator<T>` 

Help you convert a callback-style stream into an async iterator. Also works on "observable" value like RxJS.

You can think of this as a simplified `new Readable({ ... })` without headache.

#### Example

```js
const iterator = makeAsyncIterator();

socket.on('data', value => iterator.write(value));
socket.on('end', () => iterator.end());

for await (const line of iterator) {
  console.log(line);
}
```

<br />

## 🧩 flow/makeEffect

<a id="fn-makeEffect"></a>
### `makeEffect(fn, isEqual?)`

- **fn**: `(input: T, previous: T | undefined) => void | (() => void)` 

- **isEqual**: `(x: T, y: T) => boolean` 

- Returns: `{ (input: T): void; cleanup: () => void; }` 
  - **cleanup**: `() => void` — invoke last cleanup callback, and forget the last input

Wrap `fn` and create an unary function. The actual `fn()` executes only when the argument changes.

Meanwhile, your `fn` may return a cleanup function, which will be invoked before new `fn()` calls
-- just like React's `useEffect`

The new unary function also provide `cleanup()` method to forcedly do the cleanup, which will also clean the memory of last input.

#### Example

```js
const sayHi = makeEffect((name) => {
  console.log(`Hello, ${name}`);
  return () => {
    console.log(`Goodbye, ${name}`);
  }
});

sayHi('Alice');  // output: Hello, Alice
sayHi('Alice');  // no output
sayHi('Bob');    // output: Goodbye, Alice   Hello, Bob
sayHi.cleanup(); // output: Goodbye, Bob
sayHi.cleanup(); // no output
```

<br />

## 🧩 flow/maybeAsync

<a id="fn-maybeAsync"></a>
### `maybeAsync(input)`

- **input**: `T | Promise<T> | (() => T | Promise<T>)` — your sync/async function to run, or just a value

- Returns: `PromiseEx<T>` — a crafted Promise that exposes `{ status, value, reason }`, whose `status` could be `"pending" | "fulfilled" | "rejected"`

Run the function, return a crafted Promise that exposes `status`, `value` and `reason`

Useful when you are not sure whether `fn` is async or not.

<br />

## 🧩 flow/promise

<a id="fn-delay"></a>
### `delay(milliseconds)`

- **milliseconds**: `number` 

- Returns: `Promise<void>` 

<a id="fn-makePromise"></a>
### `makePromise()`

- Returns: `PromiseHandle<T>` 
  - **resolve**: `(value: T) => void` — make this Promise resolved / fulfilled with given value
  
  - **reject**: `(reason: any) => void` — make this Promise rejected with given reason / error.
  
  - **wait**: `(timeout?: number | undefined) => Promise<T>` — wait for result. optionally can set a timeout in milliseconds.
  
  - **peek**: `() => PromisePeekResult<T>` — check the Promise's status 
    - returns `{ status, value, reason }`, whose `status` could be `"pending" | "fulfilled" | "rejected"`

Create a Promise and take out its `resolve` and `reject` methods.

#### Example

```js
const handler = makePromise();

doSomeRequest(..., result => handler.resolve(result));

const result = await handler.wait();
```

<a id="fn-debouncePromise"></a>
### `debouncePromise(fn)`

- **fn**: `() => Promise<T>` 

- Returns: `() => Promise<T>` 

Wrap an async nullary function. All actual calls will be suppressed until last Promise is resolved.

The suppressed call will return the running Promise, which is started before.

<br />

## 🧩 type/compare

<a id="fn-is"></a>
### `is(x, y)`

- **x**: `any` 

- **y**: `any` 

- Returns: `boolean` 

the `Object.is` algorithm

<a id="fn-shallowEqual"></a>
### `shallowEqual(objA, objB, depth?)`

- **objA**: `any` 

- **objB**: `any` 

- **depth**: `number` 

- Returns: `boolean` 

<br />

## 🧩 type/function

<a id="fn-newFunction"></a>
### `newFunction(args, code, options?)`

- **args**: `ArgNames` 

- **code**: `string` 

- **options**: `{ async?: boolean | undefined; } | undefined` 

- Returns: `Fn` 

like `new Function` but with more reasonable options and api

<br />

## 🧩 type/iterable

<a id="fn-toArray"></a>
### `toArray(value)`

- **value**: `OneOrMany<T>` 

- Returns: `T[]` 

Input anything, always return an array.

- If the input is a single value that is not an array, wrap it as a new array.
- If the input is already an array, it returns a shallow copy.
- If the input is an iterator, it is equivalent to using `Array.from()` to process it.

Finally before returning, all `null` and `undefined` will be omitted

<a id="fn-find"></a>
### `find(iterator, predicate)`

- **iterator**: `Iterable<T> | null | undefined` 

- **predicate**: `Predicate<T>` 

- Returns: `T | undefined` 

Like `Array#find`, but the input could be a Iterator (for example, from generator, `Set` or `Map`)

<a id="fn-reduce"></a>
### `reduce(iterator, initial, reducer)`

- **iterator**: `Iterable<T> | null | undefined` 

- **initial**: `U` 

- **reducer**: `(agg: U, item: T, index: number) => U` 

- Returns: `U` 

Like `Array#reduce`, but the input could be a Iterator (for example, from generator, `Set` or `Map`)

<a id="fn-head"></a>
### `head(iterator)`

- **iterator**: `Iterable<T> | null | undefined` 

- Returns: `T | undefined` 

Take the first result from a Iterator

<a id="fn-contains"></a>
### `contains(collection, item)`

- **collection**: `CollectionOf<T> | null | undefined` 

- **item**: `T` 

- Returns: `boolean` 

input an array / Set / Map / WeakSet / WeakMap / object etc, check if it contains the `item`

<a id="fn-forEach"></a>
### `forEach(objOrArray, iter)`

- **objOrArray**: `any` 

- **iter**: `(value: any, key: any, whole: any) => any` 

- Returns: `void` 

a simple forEach iterator that support both `Array | Set | Map | Object | Iterable` as the input

<br />

## 🧩 type/string

<a id="fn-stringHash"></a>
### `stringHash(str)`

- **str**: `string` 

- Returns: `number` 

Quickly compute string hash with [cyrb53 algorithm](https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js)

<a id="fn-getVariableName"></a>
### `getVariableName(basicName, existingVariables?)`

- **basicName**: `string` 

- **existingVariables**: `CollectionOf<string> | undefined` 

- Returns: `string` 

input anything weird, get a valid variable name

optionally, you can give a `existingVariables` to avoid conflicting -- the new name might have a numeric suffix

#### Example

```js
getVariableName('foo-bar')   // -> "fooBar"
getVariableName('123abc')    // -> "_123abc"
getVariableName('')          // -> "foobar"
getVariableName('name', ['name', 'age'])    // -> "name2"
```



<!-- auto generate end -->
