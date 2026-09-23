/**
 * Reveal Remi's HTML answers a character at a time without flashing raw tags.
 *
 * Tags (`<br>`, `<b>…</b>`) and entities (`&amp;`) are emitted whole; only
 * visible text advances the cursor. Open `<b>` tags are closed if the cut
 * lands mid-emphasis so the partial string stays valid HTML.
 */

export function countVisibleChars(html: string): number {
  let n = 0
  let i = 0
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      i = end === -1 ? html.length : end + 1
      continue
    }
    if (html[i] === '&') {
      const end = html.indexOf(';', i)
      if (end !== -1 && end - i < 12) {
        n++
        i = end + 1
        continue
      }
    }
    n++
    i++
  }
  return n
}

export function typeHtmlPrefix(html: string, visibleChars: number): string {
  if (visibleChars <= 0) return ''
  let out = ''
  let seen = 0
  let i = 0
  let openB = 0

  while (i < html.length && seen < visibleChars) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      if (end === -1) {
        out += html.slice(i)
        break
      }
      const tag = html.slice(i, end + 1)
      out += tag
      if (/^<b\b/i.test(tag)) openB++
      else if (/^<\/b>/i.test(tag) && openB > 0) openB--
      i = end + 1
      continue
    }
    if (html[i] === '&') {
      const end = html.indexOf(';', i)
      if (end !== -1 && end - i < 12) {
        out += html.slice(i, end + 1)
        seen++
        i = end + 1
        continue
      }
    }
    out += html[i]
    seen++
    i++
  }

  if (openB > 0) out += '</b>'.repeat(openB)
  return out
}

/** Per-character delay in ms — slightly slower on spaces so it reads like typing. */
export function charDelay(ch: string): number {
  if (ch === '\n' || ch === '.' || ch === '!' || ch === '?') return 48
  if (ch === ',' || ch === ';' || ch === ':') return 32
  if (ch === ' ') return 22
  return 16
}
