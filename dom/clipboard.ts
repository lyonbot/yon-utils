export function writeClipboard(text: string): Promise<void> {
  return new Promise(resolve => {
    function handler(ev: ClipboardEvent) {
      ev.clipboardData?.setData('text', text)
      ev.stopImmediatePropagation()
      ev.preventDefault()
    }

    try {
      document.addEventListener('copy', handler, true)
      const done = document.execCommand('copy')
      resolve(done)
    } catch {
      resolve(false)
    } finally {
      document.removeEventListener('copy', handler, true)
    }
  }).then(done => {
    if (done) return

    if (!window.navigator.clipboard) throw new Error('No support clipboard. Maybe no permission or not in https origin.')
    return navigator.clipboard.writeText(text)
  })
}

/**
 * @param timeout - default 1500
 */
export async function readClipboard(timeout = 1500): Promise<string> {
  if (!window.navigator.clipboard) throw new Error('No support clipboard. Maybe no permission or not in https origin.')

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
