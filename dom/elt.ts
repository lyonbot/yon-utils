/// <reference lib="dom" />

/**
 * Make `document.createElement` easier
 * 
 * ```js
 * var button = elt('button', { class: 'myButton', onclick: () => alert('hi') }, 'Click Me!')
 * ```
 * 
 * This function can be used as a [jsxFactory](https://www.typescriptlang.org/tsconfig#jsxFactory), aka [JSX pragma](https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/).
 * You can add /** &#64;jsx elt *&#47; into your code, then TypeScript / Babel will use `elt` to process JSX expressions:
 * 
 * > /** &#64;jsx elt *&#47;
 * >
 * > var button = &lt;button class="myButton" onclick={...}>Click Me&lt;/button></code></pre>
 *
 * @param {string} tagName - for example `"div"`
 * @param {Object} [attrs] - attribute values to be set. beware:
 *  - `onClick: fn()` will invoke addEventListener
 *  - `style` supports passing in an object
 *  - `className` will be set to `class` attribute instead
 * @param {Array<any>} [children] - can be strings, numbers, nodes. other types or nils will be omitted.
 */
export function elt<K extends keyof HTMLElementTagNameMap>(tagName: K, attrs: any, ...children: any[]): HTMLElementTagNameMap[K]
export function elt(tagName: string, attrs: any, ...children: any[]): HTMLElement
export function elt(tagName: string, attrs: any, ...children: any[]) {
  const el = document.createElement(tagName);

  if (attrs) {
    Object.keys(attrs).forEach((key) => {
      let value = attrs[key];
      if (value === false || value == null) return;
      if (value === true) value = '';

      // "onXXXX" events
      if (typeof value === 'function' && /^on\w/.test(key)) {
        const evtName = key.slice(2).toLowerCase();
        el.addEventListener(evtName, value, false);
        return;
      }

      // "style"
      if (key === 'style' && typeof value === 'object') {
        Object.keys(value).forEach((k) => {
          el.style[k as any] = value[k];
        });
        return;
      }

      // "className" for TypeScript
      if (key === 'className') key = 'class'

      el.setAttribute(key, String(value));
    });
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (Array.isArray(child)) { children.splice(i--, 1, ...child); continue }
    if (!child && child !== 0) continue
    if (child instanceof Node) el.appendChild(child);
    el.appendChild(document.createTextNode(String(child)))
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
