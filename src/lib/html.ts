/**
 * The extracted data is full of HTML entities because the legacy app rendered
 * it through `innerHTML`, which decoded them. React text interpolation does
 * not, so `"Renee &amp; Andre"` would render literally with the ampersand
 * spelled out.
 *
 * This decodes only the entity forms the data actually contains. A DOMParser
 * would handle every case, but it runs per call and this is called during
 * render for every family task.
 */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
}

export function decodeEntities(s: string): string {
  if (!s.includes('&')) return s
  return s.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
}
