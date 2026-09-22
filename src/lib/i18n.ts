import l10n from '@/data/l10n.json'

export const LANGS = ['en', 'es', 'ht', 'vi'] as const
export type Lang = (typeof LANGS)[number]

/** Native-language labels for the switcher, matching the legacy app. */
export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  ht: 'Kreyòl Ayisyen',
  vi: 'Tiếng Việt',
}

/** BCP 47 tags for `<html lang>` and `toLocaleDateString`. */
export const LANG_HTML: Record<Lang, string> = {
  en: 'en',
  es: 'es',
  ht: 'ht',
  vi: 'vi',
}

type Dict = Record<string, string>

const DICTS = l10n as unknown as Record<Lang, Dict>

/**
 * Look a key up in the active language.
 *
 * Falls back to English, then to the key itself — the same three-step fallback
 * the legacy `T()` used. The non-English dictionaries are genuinely incomplete
 * (es is missing 12 keys, ht and vi 16 each), and that fallback is what has
 * been hiding the gaps. Typing the dictionaries as `Partial` in a later pass
 * would surface them, but changing the fallback now would change behaviour
 * during a port, which is not the job.
 */
export function translate(lang: Lang, key: string): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key
}

/**
 * Substitute per-patient tokens into an already-translated string.
 *
 * This is load-bearing, not cosmetic. Without it a language switch would write
 * one patient's name over every other patient's view: the binding would hold
 * until someone touched the language selector, then silently break. The legacy
 * file carries the same warning.
 *
 * Supported tokens: {name} {full} {age} {chip} {short} {profile}
 */
export function interp(s: string, vars: Record<string, string | number> = {}): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

/** True when a translated string is meant to be rendered as HTML. */
export function isHtmlKey(key: string): boolean {
  return /\.(h1|h2|body|html)$/.test(key)
}

/** Mirror the active language onto `<html lang>` for a11y and browser UI. */
export function applyDocumentLang(lang: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = LANG_HTML[lang]
}
