/**
 * Model output is untrusted text, so escape it — then restore ONLY the tags
 * the system prompt asks Remi to use: `<b>` / `</b>` and `<br>`.
 *
 * Escaping first means a literal "&lt;b&gt;" from the model stays escaped, and
 * `<img onerror=…>` stays inert. Restoring `<br>` is load-bearing: without it,
 * replies show the characters "<br><br>" instead of real line breaks.
 *
 * The local engine's strings are authored, not generated, but they go through
 * the same path so there is exactly one place where HTML reaches the DOM.
 */
export function remiSafeHtml(s: unknown): string {
  let t = String(s ?? '')

  // Soften common markdown the model sometimes emits despite the prompt.
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  t = t.replace(/__([^_]+)__/g, '<b>$1</b>')
  t = t.replace(/^#{1,6}\s+/gm, '')

  // Plain newlines → breaks so cloud replies still paragraph without tags.
  t = t.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>')

  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?b)&gt;/gi, '<$1>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
}
