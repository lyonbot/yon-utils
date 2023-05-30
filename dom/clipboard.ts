/**
 * write text to clipboard, with support for insecure context and legacy browser!
 * 
 * note: if you are in HTTPS and modern browser, you can directly use `navigator.clipboard.writeText()` instead.
 */
export async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  // ----------------------------------------------------------------
  // use legacy way to write clipboard
  // ( in fact not really necessary: just for legacy browsers only )
  // ( you can use navigator.clipboard.writeText() instead )

  let promiseCallback: undefined | ((result: boolean) => void)
  function handler(ev: ClipboardEvent) {
    ev.clipboardData?.setData('text', text)
    ev.stopImmediatePropagation()
    ev.preventDefault()
    promiseCallback && promiseCallback(true)
  }
  document.addEventListener('copy', handler, true)
  const legacyTimer = setTimeout(() => promiseCallback!(false), 700)

  try {
    const legacyCopyPromise = new Promise(resolve => { promiseCallback = resolve })
    document.execCommand('copy')
    if (await legacyCopyPromise) return
  } catch {
  } finally {
    clearTimeout(legacyTimer)
    document.removeEventListener('copy', handler, true)
  }
}

/**
 * read clipboard text.
 * 
 * if user rejects or hesitates about the permission for too long,
 * this will throw an Error.
 * 
 * @param timeout - default 1500
 */
export async function readClipboard(timeout = 1500): Promise<string> {
  if (!navigator.clipboard) {
    throw new Error('No support clipboard. Maybe no permission or not in https origin.')
  }

  let resolved = false
  let ans = await Promise.race([
    navigator.clipboard.readText(),
    new Promise<string>((res, rej) => {
      setTimeout(() => resolved ? res('') : rej(new Error('Timeout')), timeout);
    }),
  ])

  resolved = true
  return ans
}
