/**
 * Model output is untrusted text, so escape it — then restore ONLY the `<b>` /
 * `</b>` pair the system prompt asks the model to use.
 *
 * Escaping first means a literal "&lt;b&gt;" from the model stays escaped, and
 * `<img onerror=…>` stays inert. (Escaping everything and restoring nothing is
 * what made answers show raw "<b>" tags.)
 *
 * The local engine's strings are authored, not generated, but they go through
 * the same path so there is exactly one place where HTML reaches the DOM.
 */
export function remiSafeHtml(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?b)&gt;/g, '<$1>')
}
