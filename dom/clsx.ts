function toVal(mix: any) {
  if (typeof mix === 'string') return mix

  var k, y, str = '';
  if (typeof mix === 'object') {
    if (Array.isArray(mix)) {
      for (const it of mix) {
        if (y = toVal(it)) str += (str && ' ') + y;
      }
    } else {
      for (k in mix) {
        if (mix[k]) str += (str && ' ') + k;
      }
    }
  }

  return str;
}

/**
 * construct className strings conditionally.
 * 
 * can be an alternative to `classnames()`. modified from [lukeed/clsx](https://github.com/lukeed/clsx). to integrate with Tailwind VSCode, [read this](https://github.com/lukeed/clsx#tailwind-support)
 */
export function clsx(...args: any[]) {
  let str = '';
  for (const tmp of args) {
    const x = tmp && toVal(tmp);
    if (x) str += (str && ' ') + x;
  }
  return str;
}
