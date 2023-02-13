# yon-utils

Some utils that I repeated too many times. DRY!

All modules are shipped as ES modules and tree-shakable.

- via package manager

  `npm install yon-utils`

- via import within `<script type="module">`

  `import { elt } from "https://unpkg.com/yon-utils"`

<!-- auto generate begin -->

<br />

## 🧩 dom/clipboard

### `writeClipboard(text)`

- **text**: `string` 

- Returns: `Promise<void>` 




### `readClipboard(timeout?)`

- **timeout**: `number` - default 1500

- Returns: `Promise<string>` 




<br />

## 🧩 dom/elt

### `elt(tagName, attrs, ...children)`

- **tagName**: `string` - for example `"div"`

- **attrs**: `any` - attribute values to be set. beware:
  - `onClick: fn()` will invoke addEventListener
  - `style` supports passing in an object
  - `className` will be set to `class` attribute instead

- **children**: `any[]` - can be strings, numbers, nodes. other types or nils will be omitted.

- Returns: `HTMLElement` 

Make `document.createElement` easier

```js
var button = elt('button', { class: 'myButton', onclick: () => alert('hi') }, 'Click Me!')
```

This function can be used as a [jsxFactory](https://www.typescriptlang.org/tsconfig#jsxFactory), aka [JSX pragma](https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/).
You can add /** &#64;jsx elt *&#47; into your code, then TypeScript / Babel will use `elt` to process JSX expressions:

> /** &#64;jsx elt *&#47;
>
> var button = &lt;button class="myButton" onclick={...}>Click Me&lt;/button></code></pre>


<br />

## 🧩 dom/mouseMove

### `startMouseMove({ initialEvent, onMove, onEnd })`

- **__0**: `MouseMoveInitOptions` 

- Returns: `Promise<MouseMoveInfo>` - the final position when user releases button

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


<!-- auto generate end -->
