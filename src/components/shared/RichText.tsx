/**
 * Renders the small amount of inline markup that ships inside the app's own
 * translated strings — `<b>` around a family member's name, mostly.
 *
 * This is NOT for anything user- or model-supplied. Both sources are static:
 * the i18n dictionary and `src/data/patients.json`, both extracted verbatim
 * from the legacy file and neither reachable from input. React's text
 * interpolation would show the tags as literal angle brackets, which is why
 * this exists at all.
 *
 * Remi's answers are a different case and get their own escaping — see the
 * Remi port, which sanitises before rendering.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
