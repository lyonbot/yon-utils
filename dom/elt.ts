/// <reference lib="dom" />

import { clsx } from "./clsx.js";

/**
 * Make `document.createElement` easier
 * 
 * ```js
 * var button = elt(
 *   'button.myButton',   // tagName, optionally support .className and #id
 *   {
 *     title: "a magic button",
 *     class: { isPrimary: xxx.xxx }, // className will be processed by clsx
 *     onclick: () => alert('hi')
 *   }, 
 *   'Click Me!'
 * )
 * ```
 * 
 * This function can be used as a [jsxFactory](https://www.typescriptlang.org/tsconfig#jsxFactory), aka [JSX pragma](https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/).
 * You can add <code>/** &#64;jsx elt *&#47;</code> into your code, then TypeScript / Babel will use `elt` to process JSX expressions:
 * 
 * > /** &#64;jsx elt *&#47;
 * >
 * > var button = &lt;button class="myButton" onclick={...}>Click Me&lt;/button></code></pre>
 *
 * @param {string} tagName - for example `"div"` or `"button.my-btn"`
 * @param {Object} [attrs] - attribute values to be set. beware:
 *  - `onClick` and a `function` value, will be handled by `addEventListener()`
 *  - `!onClick` or `onClick.capture` will make it capture
 *  - `style` value could be a string or object
 *  - `class` value could be a string, object or array, and will be process by `clsx()`
 *  - `className` is alias of `class`
 * @param {Array<any>} [children] - can be strings, numbers, nodes. other types or nils will be omitted.
 */
export function elt<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs: any, ...children: any[]): HTMLElementTagNameMap[K]
export function elt(tagName: string, attrs: any, ...children: any[]): HTMLElement
export function elt(tagName: string, attrs: any, ...children: any[]) {
  const decorators = (tagName.includes('#') || tagName.includes('.')) && tagName.split(/(?=[#.])/g)
  if (decorators) tagName = decorators.shift()!

  const el = document.createElement(tagName.trim());

  if (attrs) {
    Object.keys(attrs).forEach((key) => {
      let value = attrs[key];
      if (value === false || value == null) return;
      if (value === true) value = '';

      // "onXXXX" events
      let evtMat = typeof value === 'function' && /^(!?)on([\w-]+)([._]capture)?$/.exec(key)
      if (evtMat) {
        const evtName = evtMat[2].toLowerCase();
        const capture = !!(evtMat[1] || evtMat[3])
        el.addEventListener(evtName, value, capture);
        return;
      }

      // "style"
      if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => {
          if (typeof v === 'number') v = v + 'px'
          el.style[k as any] = v as string;
        });
        return;
      }

      // "className" for TypeScript
      if (key === 'className') key = 'class'
      if (key === 'class') value = clsx(value)

      el.setAttribute(key, String(value));
    });
  }

  // handle tag.className#id
  if (decorators) {
    for (let seg of decorators) {
      seg = seg.trimEnd()
      if (seg[0] === '#') el.id = seg.slice(1)
      if (seg[0] === '.') el.className += (el.className && ' ') + seg.slice(1)
    }
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (Array.isArray(child)) { children.splice(i--, 1, ...child); continue }
    if (!child && child !== 0) continue

    if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)))
  }

  return el;
}

export namespace elt {
  export namespace JSX {
    export type Element = HTMLElement
    export type IntrinsicElements = {
      [k in keyof HTMLElementTagNameMap]: NodeAttr<HTMLElementTagNameMap[k]>
    } & { [k: string]: any }
  }
}

type NodeAttr<THIS> = {
  [k in keyof HTMLElementEventMap as `on${k}`]?: (this: THIS, ev: HTMLElementEventMap[k]) => any
} & {
  class?: string;
  style?: any;
  [k: string]: any
}
