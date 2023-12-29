# yon-utils

Some utils and remix that I repeated in many projects.

This package includes some light-weight alternatives to packages like:

our | is alternative to / remix of
------- | ----------------- 
[elt](#fn-elt) / [clsx](#fn-clsx) | clsx, classnames, h, hyperscript
[maybeAsync](#fn-maybeAsync) / [makePromise](#fn-makePromise) / [PromiseEx](#fn-PromiseEx) | imperative-promise, bluebird
[stringHash](#fn-stringHash) | cyrb53, murmurhash ...
&lt;some lodash-like functions> | lodash

There are also some interesting original utils like [shallowEqual](#fn-shallowEqual) / [newFunction](#fn-newFunction) / [toArray](#fn-toArray) / [getVariableName](#fn-getVariableName) etc. Feel free to explore!

## QuickStart

[Play in CodeSandbox](https://codesandbox.io/s/yon-utils-playground-xwh4qt)

All modules are shipped as ES modules and tree-shakable.

- via package manager

  `npm install yon-utils`

- via import within `<script type="module">`

  `import { elt } from "https://unpkg.com/yon-utils"`

<!-- auto generate begin -->



## ToC

| module | methods |
|---------|:--------|
| dom | [writeClipboard](#writeclipboardtext) / [readClipboard](#readclipboardtimeout) / [clsx](#clsxargs) / [elt](#elttagname-attrs-children) / [startMouseMove](#startmousemove-initialevent-onmove-onend-) |
| flow | [delay](#delaymilliseconds) / [debouncePromise](#debouncepromisefn) / [fnQueue](#fnqueue) / [makeAsyncIterator](#makeasynciterator) / [makeEffect](#makeeffectfn-isequal) / [maybeAsync](#maybeasyncinput) / [makePromise](#makepromise) / [PromiseEx](#new-promiseexexecutor) / [PromisePendingError](#new-promisependingerrorcause) / [timing](#timingoutput-promise) / [withDefer](#withdeferfn) / [withAsyncDefer](#withasyncdeferfn) |
| manager | [ModuleLoader](#new-moduleloadersource) / [CircularDependencyError](#new-circulardependencyerrorquery-querystack) / [getSearchMatcher](#getsearchmatcherkeyword) |
| type | [is](#isx-y) / [shallowEqual](#shallowequalobja-objb-depth) / [newFunction](#newfunctionargumentnames-functionbody-options) / [noop](#noop) / [toArray](#toarrayvalue) / [find](#finditerator-predicate) / [reduce](#reduceiterator-initial-reducer) / [head](#headiterator) / [contains](#containscollection-item) / [forEach](#foreachobjorarray-iter) / [stringHash](#stringhashstr) / [getVariableName](#getvariablenamebasicname-existingvariables) / [bracket](#brackettext1-text2-brackets) / [isNil](#isnilobj) / [isObject](#isobjectobj) / [isThenable](#isthenablesth) |

<br />

## 🧩 dom/clipboard

<a id="writeclipboardtext"></a>

### `writeClipboard(text)`

- **text**: `string`

- Returns: `Promise<void>`

write text to clipboard, with support for insecure context and legacy browser!

note: if you are in HTTPS and modern browser, you can directly use `navigator.clipboard.writeText()` instead.

<a id="readclipboardtimeout"></a>

### `readClipboard(timeout?)`

- **timeout?**: `number` — default 1500

- Returns: `Promise<string>`

read clipboard text.

if user rejects or hesitates about the permission for too long,
this will throw an Error.

<br />

## 🧩 dom/clsx

<a id="clsxargs"></a>

### `clsx(...args)`

- **args**: `any[]`

- Returns: `string`

construct className strings conditionally.

can be an alternative to `classnames()`. modified from [lukeed/clsx](https://github.com/lukeed/clsx). to integrate with Tailwind VSCode, [read this](https://github.com/lukeed/clsx#tailwind-support)

<br />

## 🧩 dom/elt

<a id="elttagname-attrs-children"></a>

### `elt(tagName, attrs, ...children)`

- **tagName**: `string` — for example `"div"` or `"button.my-btn"`

- **attrs**: `any` — attribute values to be set. beware:
    - `onClick` and a `function` value, will be handled by `addEventListener()`
    - `!onClick` or `onClick.capture` will make it capture
    - `style` value could be a string or object
    - `class` value could be a string, object or array, and will be process by `clsx()`
    - `className` is alias of `class`

- **children**: `any[]` — can be strings, numbers, nodes. other types or nils will be omitted.

- Returns: `HTMLElement`

Make `document.createElement` easier

```js
var button = elt(
  'button.myButton',   // tagName, optionally support .className and #id
  {
    title: "a magic button",
    class: { isPrimary: xxx.xxx }, // className will be processed by clsx
    onclick: () => alert('hi')
  }, 
  'Click Me!'
)
```

This function can be used as a [jsxFactory](https://www.typescriptlang.org/tsconfig#jsxFactory), aka [JSX pragma](https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/).
You can add <code>/** &#64;jsx elt *&#47;</code> into your code, then TypeScript / Babel will use `elt` to process JSX expressions:

> /** &#64;jsx elt *&#47;
>
> var button = &lt;button class="myButton" onclick={...}>Click Me&lt;/button></code></pre>

<br />

## 🧩 dom/mouseMove

<a id="startmousemove-initialevent-onmove-onend-"></a>

### `startMouseMove({ initialEvent, onMove, onEnd })`

- **__0**: `MouseMoveInitOptions` 
  - **initialEvent**: `MouseEvent | PointerEvent` 
  
  - **onMove?**: `(data: MouseMoveInfo) => void` 
  
  - **onEnd?**: `(data: MouseMoveInfo) => void`

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

## 🧩 flow/flow

<a id="delaymilliseconds"></a>

### `delay(milliseconds)`

- **milliseconds**: `number`

- Returns: `Promise<void>`

<a id="debouncepromisefn"></a>

### `debouncePromise(fn)`

- **fn**: `() => Promise<T>` — The function to be debounced.

- Returns: `() => Promise<T>` — The debounced function.

Creates a debounced version of a function that returns a promise.

The returned function will ensure that only one Promise is created and executed at a time,
even if the debounced function is called multiple times before last Promise gets finished.

All _suppressed_ calls will get the last started Promise.

<br />

## 🧩 flow/fnQueue

<a id="fnqueue"></a>

### `fnQueue()`

- Returns: `{ tap, call, queue }` 
  - **tap**: `(...fns: (Fn<any, ARGS> | Falsy)[]) => void` — add callbacks into the queue
  
  - **call**: `(...args: ARGS) => void` — invoke all callbacks and clear the queue
  
  - **queue**: `Fn<any, ARGS>[]` — the array of all tapped callbacks

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

<a id="makeasynciterator"></a>

### `makeAsyncIterator()`

- Returns: `{ write(value: T): void; end(error?: any): void; } & AsyncIterableIterator<T>`

Help you convert a callback-style stream into an async iterator. Also works on "observable" value like RxJS.

You can think of this as a simplified `new Readable({ ... })` without headache.

#### Example

```js
const iterator = makeAsyncIterator();

socket.on('data', value => iterator.write(value));
socket.on('end', () => iterator.end());
socket.on('error', (err) => iterator.end(err));

for await (const line of iterator) {
  console.log(line);
}
```

<br />

## 🧩 flow/makeEffect

<a id="makeeffectfn-isequal"></a>

### `makeEffect(fn, isEqual?)`

- **fn**: `(input: T, previous: T | undefined) => void | (() => void)`

- **isEqual?**: `(x: T, y: T) => boolean`

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

## 🧩 flow/promise

<a id="maybeasyncinput"></a>

### `maybeAsync(input)`

- **input**: `T | Promise<T> | (() => T | Promise<T>)` — your sync/async function to run, or just a value

- Returns: `PromiseEx<Awaited<T>>` — a crafted Promise that exposes `{ status, value, reason }`, whose `status` could be `"pending" | "fulfilled" | "rejected"`
  - **status**: `"pending" | "fulfilled" | "rejected"` 
  
  - **reason**: `any` — if rejected, get the reason.
  
  - **result?**: `NonNullable<T>` — get result, or nothing if not fulfilled.
    
    note: you might need `.value` which follows **fail-fast mentality**
  
  - **loading**: `boolean` — equivalent to `.status === "pending"`
  
  - **value?**: `NonNullable<T>` — **fail-fast mentality**, safely get the result.
    
    - if pending, throw `new PromisePendingError(this)`
    - if rejected, throw `.reason`
    - if fulfilled, get `.result`
  
  - **wait**: `(timeout: number) => Promise<T>` — wait for resolved / rejected. 
    
    optionally can set a timeout in milliseconds. if timeout, a `PromisePendingError` will be thrown
  
  - **thenImmediately**: `<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | Nil, onrejected?: Nil | ((reason: any) => TResult2 | PromiseLike<...>)) => PromiseEx<...>` — Like `then()` but immediately invoke callbacks, if this PromiseEx
    is already resolved / rejected.

Run the function, return a crafted Promise that exposes `status`, `value` and `reason`

If `input` is sync function, its result will be stored in `promise.value` and `promise.status` will immediately be set as "fulfilled"

Useful when you are not sure whether `fn` is async or not.

<a id="makepromise"></a>

### `makePromise()`

- Returns: `ImperativePromiseEx<T>`

Create an imperative Promise.

Returns a Promise with these 2 methods exposed, so you can control its behavior:

- `.resolve(result)`
- `.reject(error)`

Besides, the returned Promise will expose these useful properties
so you can get its status easily:
 
- `.wait([timeout])` — wait for result, plus timeout guard
- `.status` — could be `"pending" | "fulfilled" | "rejected"`
- `.result` and `.reason`
- `.value` — fail-safe get result

Note that calling `wait(timeout)` and accessing `value` could throw a `PromisePendingError`

#### Example

```js
const handler = makePromise();

doSomeRequest(..., result => handler.resolve(result));

// wait with timeout
const result = await handler.wait(1000);

// or just await
const result = await handler;
```

<a id="new-promiseexexecutor"></a>

### `new PromiseEx(executor)`

- **executor**: `(resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void`

a crafted Promise that exposes `{ status, value, reason }`

Note: please use `maybeAsync()` or `PromiseEx.resolve()` to create a PromiseEx

<details>
<summary>
<em>📖 show members of <code>PromiseEx</code> &raquo;</em>
</summary>

#### PromiseEx # status
- Type: `"pending" | "fulfilled" | "rejected"`

#### PromiseEx # reason
- Type: `any`

if rejected, get the reason.

#### PromiseEx # result
- Type: `T | undefined`

get result, or nothing if not fulfilled.

note: you might need `.value` which follows **fail-fast mentality**

#### PromiseEx # loading
- Type: `boolean`

equivalent to `.status === "pending"`

#### PromiseEx # value
- Type: `T | undefined`

**fail-fast mentality**, safely get the result.

- if pending, throw `new PromisePendingError(this)`
- if rejected, throw `.reason`
- if fulfilled, get `.result`

#### PromiseEx # wait(timeout)
- **timeout**: `number`

- Returns: `Promise<T>`

wait for resolved / rejected. 

optionally can set a timeout in milliseconds. if timeout, a `PromisePendingError` will be thrown

#### PromiseEx # thenImmediately(onfulfilled?, onrejected?)
- **onfulfilled?**: `(value: T) => TResult1 | PromiseLike<TResult1>`

- **onrejected?**: `(reason: any) => TResult2 | PromiseLike<TResult2>`

- Returns: `PromiseEx<TResult1 | TResult2>`

Like `then()` but immediately invoke callbacks, if this PromiseEx
is already resolved / rejected.

</details>

<a id="new-promisependingerrorcause"></a>

### `new PromisePendingError(cause)`

- **cause**: `Promise<any>`

Could be thrown from `.value` and `.wait(timeout)` of PromiseEx

<details>
<summary>
<em>📖 show members of <code>PromisePendingError</code> &raquo;</em>
</summary>

#### PromisePendingError # cause
- Type: `Promise<any>`

</details>

<br />

## 🧩 flow/timing

<a id="timingoutput-promise"></a>

### `timing(output, promise)`

- **output**: `string | Nil | PrintMethod` — can be:
    - a `(timeMs, sinceMs) => void`
    - a `string` - print labelled result with `timing.defaultPrint()`, defaults to console.log

- **promise**: `T`

- Returns: `T` — result of `fn()`

Measures time of execution of `executeFn()`. Works on async function and Promise too.

#### Example

```js
const result = timing('read', () => {
  const data = fs.readFileSync('xxx');
  const decrypted = crypto.decrypt(data, key);
  return decrypt;
})

// get result
// meanwhile, console prints "[read] took 120ms"
```

Or with custom logger

```js
const print = (ms) => console.log(`[timing] fetching took ${ms}ms`)

const result = await timing(print, async () => {
  const resp = await fetch('/user/xxx');
  const user = await resp.json();
  return user;
})
```

<br />

## 🧩 flow/withDefer

<a id="withdeferfn"></a>

### `withDefer(fn)`

- **fn**: `(defer: DeferFunction<any>) => Ret`

- Returns: `Ret`

Like golang and other language, use `defer(callback)` to properly release resources, and avoid `try catch finally` hells.

All deferred callbacks are invoked in `finally` blocks.
If one callback throws, its following callbacks still work. At the end, `withDefer` only throws the last Error.

```js
// sync
const result = withDefer((defer) => {
  const file = openFileSync('xxx')
  defer(() => closeFileSync(file))  // <-

  const parser = createParser()
  defer(() => parser.dispose())  // <-

  return parser.parse(file.readSync())
})
```

If using async functions, use `withAsyncDefer`

```js
// async
const result = await withAsyncDefer(async (defer) => {
  const file = await openFile('xxx')
  defer(async () => await closeFile(file))  // <- defer function can be async now!

  const parser = createParser()
  defer(() => parser.dispose())  // <-

  return parser.parse(await file.read())
})
```

If you want to suppress the callbacks' throwing, use `defer.silent`

```js
defer.silent(() => closeFile(file))  // will never throws
```

<a id="withasyncdeferfn"></a>

### `withAsyncDefer(fn)`

- **fn**: `(defer: AsyncDeferFunction) => Ret`

- Returns: `Ret`

Same as **withDefer** plus it returns a Promise, and supports async callbacks.

<br />

## 🧩 manager/moduleLoader

<a id="new-moduleloadersource"></a>

### `new ModuleLoader(source)`

- **source**: `ModuleLoaderSource<T>` 
  - **resolve**: `(query: string, ctx: { load(target: string): PromiseEx<T>; noCache<T>(value: T): T; }) => MaybePromise<T>` — You must implement a loader function. It parse `query` and returns the module content.
    
    1. It could be synchronous or asynchronous, depends on your scenario.
    2. You can use `load()` from `ctx` to load dependencies. Example: `await load("common")` or `load("common").value`
    3. All queries are cached by default. To bypass it, use `ctx.noCache`. Example: `return noCache("404: not found")`
  
  - **cache?**: `ModuleLoaderCache<any>`

All-in-one ModuleLoader, support both sync and async mode, can handle circular dependency problem.

### Example in Sync

```js
const loader = new ModuleLoader({
  // sync example
  resolve(query, { load }) {
    if (query === 'father') return 'John'
    if (query === 'mother') return 'Mary'

    // simple alias: just `return load('xxx')`
    if (query === 'mom') return load('mother')

    // load dependency
    // - `load('xxx').value` for sync, don't forget .value
    // - `await load('xxx')` for async
    if (query === 'family') return `${load('father').value} and ${load('mother').value}`

    // always return something as fallback
    return 'bad query'
  }
})

console.log(loader.load('family').value)  // don't forget .value
```

### Example in Async

```js
const loader = new ModuleLoader({
  // async example
  async resolve(query, { load }) {
    if (query === 'father') return 'John'
    if (query === 'mother') return 'Mary'

    // simple alias: just `return load('xxx')`
    if (query === 'mom') return load('mother')

    // load dependency
    // - `await load('xxx')` for async
    // - no need `.value` in async mode
    if (query === 'family') return `${await load('father')} and ${await load('mother')}`

    // always return something as fallback
    return 'bad query'
  }
})

console.log(await loader.load('family'))  // no need `.value` with `await`
```

<details>
<summary>
<em>📖 show members of <code>ModuleLoader</code> &raquo;</em>
</summary>

#### ModuleLoader # cache
- Type: `ModuleLoaderCache<{ dependencies?: string[] | undefined; promise: PromiseEx<T>; }>`

#### ModuleLoader # load(query)
- **query**: `string`

- Returns: `PromiseEx<T>`

fetch a module

#### ModuleLoader # getDependencies(query, deep?)
- **query**: `string`

- **deep?**: `boolean`

- Returns: `PromiseEx<string[]>`

get all direct dependencies of a module.

note: to get reliable result, this will completely load the module and deep dependencies.

</details>

<a id="new-circulardependencyerrorquery-querystack"></a>

### `new CircularDependencyError(query, queryStack)`

- **query**: `string`

- **queryStack**: `string[]`

The circular dependency Error that `ModuleLoader` might throw.

<details>
<summary>
<em>📖 show members of <code>CircularDependencyError</code> &raquo;</em>
</summary>

#### CircularDependencyError # query
- Type: `string`

the module that trying to be loaded.

#### CircularDependencyError # queryStack
- Type: `string[]`

the stack to traceback the loading progress.

#### CircularDependencyError # name
- Type: `string`

always `'CircularDependencyError'`

</details>

<br />

## 🧩 manager/simpleSearch

<a id="getsearchmatcherkeyword"></a>

### `getSearchMatcher(keyword)`

- **keyword**: `string`

- Returns: `{ test, filter, filterEx }` 
  - **test**: `(record: any) => number` — test one record and tell if it matches.
    
    the `record` could be a string, array and object(only values will be tested).
    
    will return `0` for not matched, `1` for fuzzy matched, `> 1` for partially accurately matched
  
  - **filter**: `FilterFunction` — filter a list / collection, and get the sorted search result.
    
    returns a similarity-sorted array of matched values.
    
    also see `filterEx` if want more information
  
  - **filterEx**: `FilterExFunction` — filter a list / collection, and get the sorted search result with extra information.
    
    returns a similarity-sorted array of `{ value, score, index, key }`.
    
    also see `filter` if you just want the values.

Simple utility to start searching

#### Example

```js
// note: items can be object / array / array of objects ...
const items = ['Alice', 'Lichee', 'Bob'];

const result = getSearchMatcher('lic').filter(items);
// -> ['Lichee', 'Alice']
```

<br />

## 🧩 type/compare

<a id="isx-y"></a>

### `is(x, y)`

- **x**: `any`

- **y**: `any`

- Returns: `boolean`

the `Object.is` algorithm

<a id="shallowequalobja-objb-depth"></a>

### `shallowEqual(objA, objB, depth?)`

- **objA**: `any`

- **objB**: `any`

- **depth?**: `number` — defaults to 1

- Returns: `boolean`

<br />

## 🧩 type/function

<a id="newfunctionargumentnames-functionbody-options"></a>

### `newFunction(argumentNames, functionBody, options?)`

- **argumentNames**: `NameArray<ARGS>` — a `string[]` of argument names

- **functionBody**: `string` — the function body

- **options?**: `{ async?: boolean | undefined; }` 
  - **async?**: `boolean` — set to `true` if the code contains `await`, the new function will be an async function

- Returns: `Fn<RESULT, ARGS>`

like `new Function` but with more reasonable options and api

<a id="noop"></a>

### `noop()`

- Returns: `void`

<br />

## 🧩 type/iterable

<a id="toarrayvalue"></a>

### `toArray(value)`

- **value**: `OneOrMany<T>`

- Returns: `T[]`

Input anything, always return an array.

- If the input is a single value that is not an array, wrap it as a new array.
- If the input is already an array, it returns a shallow copy.
- If the input is an iterator, it is equivalent to using `Array.from()` to process it.

Finally before returning, all `null` and `undefined` will be omitted

<a id="finditerator-predicate"></a>

### `find(iterator, predicate)`

- **iterator**: `Nil | Iterable<T>`

- **predicate**: `Predicate<T>`

- Returns: `T | undefined`

Like `Array#find`, but the input could be a Iterator (for example, from generator, `Set` or `Map`)

<a id="reduceiterator-initial-reducer"></a>

### `reduce(iterator, initial, reducer)`

- **iterator**: `Nil | Iterable<T>`

- **initial**: `U`

- **reducer**: `(agg: U, item: T, index: number) => U`

- Returns: `U`

Like `Array#reduce`, but the input could be a Iterator (for example, from generator, `Set` or `Map`)

<a id="headiterator"></a>

### `head(iterator)`

- **iterator**: `Nil | Iterable<T>`

- Returns: `T | undefined`

Take the first result from a Iterator

<a id="containscollection-item"></a>

### `contains(collection, item)`

- **collection**: `Nil | CollectionOf<T>`

- **item**: `T`

- Returns: `boolean`

input an array / Set / Map / WeakSet / WeakMap / object etc, check if it contains the `item`

<a id="foreachobjorarray-iter"></a>

### `forEach(objOrArray, iter)`

- **objOrArray**: `any`

- **iter**: `(value: any, key: any, whole: any) => any`

- Returns: `void`

a simple forEach iterator that support both `Array | Set | Map | Object | Iterable` as the input

<br />

## 🧩 type/string

<a id="stringhashstr"></a>

### `stringHash(str)`

- **str**: `string`

- Returns: `number`

Quickly compute string hash with [cyrb53 algorithm](https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js)

<a id="getvariablenamebasicname-existingvariables"></a>

### `getVariableName(basicName, existingVariables?)`

- **basicName**: `string`

- **existingVariables?**: `CollectionOf<string>`

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

<a id="brackettext1-text2-brackets"></a>

### `bracket(text1, text2, brackets?)`

- **text1**: `string | number | null | undefined`

- **text2**: `string | number | null | undefined`

- **brackets?**: `string | [string, string]` — defaults to `[" (", ")"]`

- Returns: `string`

Add bracket (parenthesis) to text

- `bracket("c_name", "Column Name")` => `"c_name (Column Name)"`
- `bracket("Column Name", "c_name")` => `"Column Name (c_name)"`

If one parameter is empty, it returns the other one:

- `bracket("c_name", null)` => `"c_name"`
- `bracket(null, "c_name")` => `"c_name"`

<br />

## 🧩 type/types

<a id="isnilobj"></a>

### `isNil(obj)`

- **obj**: `any`

- Returns: `boolean`

Tell if `obj` is null or undefined

<a id="isobjectobj"></a>

### `isObject(obj)`

- **obj**: `any`

- Returns: `false | "array" | "object"`

Tell if `obj` is Array, Object or other(`false`)

<a id="isthenablesth"></a>

### `isThenable(sth)`

- **sth**: `any`

- Returns: `boolean`



<!-- auto generate end -->
