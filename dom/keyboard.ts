export const IS_MAC = navigator.platform.startsWith('Mac');
export const MOD_KEY = IS_MAC ? 'metaKey' : 'ctrlKey';
export const MOD_KEY_LABEL = IS_MAC ? '⌘' : 'Ctrl';

export interface KeyboardEventLike {
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

/**
 * get Modifier Key status from a Event
 * 
 * @remark 
 * 
 * 1. use `modKey.Mod` to indicate if the key is `⌘`(Cmd) on Mac, or `Ctrl` on Windows/Linux
 * 2. use `|` (or operator) to combine modifier keys. see example below.
 * 
 * @example 
 * 
 * ```js
 * if (modKey(ev) === (modKey.Mod | modKey.Shift) && ev.code === 'KeyW') {
 *   // Ctrl/Cmd + Shift + W, depends on the OS
 * }
 * ```
 */
export function modKey(ev: KeyboardEventLike) {
  const num =
    (ev.ctrlKey ? modKey.Ctrl : 0) |
    (ev.metaKey ? modKey.Cmd : 0) |
    (ev.shiftKey ? modKey.Shift : 0) |
    (ev.altKey ? modKey.Alt : 0);

  return num
}

export namespace modKey {
  export const None = 0;
  export const Ctrl = 1 << 0;
  export const Cmd = 1 << 1
  export const Shift = 1 << 2;
  export const Alt = 1 << 3;

  /** Mod key is `⌘`(Cmd) on Mac, or `Ctrl` on Windows/Linux */
  export const Mod = MOD_KEY === 'ctrlKey' ? Ctrl : Cmd;
}
