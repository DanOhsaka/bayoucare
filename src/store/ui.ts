import { create } from 'zustand'
import type { Lang } from '@/lib/i18n'
import { LANGS } from '@/lib/i18n'

export type Mode = 'patient' | 'admin'
export type Theme = 'light' | 'dark'

const THEME_KEY = 'bc-theme'
const LANG_KEY = 'bc-lang'

/**
 * Presentation state only: which mode is showing, the language, the theme.
 *
 * The governing invariant, carried over from the legacy app: **mode is a
 * presentation concern.** No data-layer value may depend on it, and hidden
 * views stay mounted. That is what keeps the cross-module demo moments alive
 * (the 2am vitals replay feeding the Morning Sweep, the counterfactual feeding
 * the prior-auth packet). Keeping mode in its own store with no other store
 * importing it is how that stays true rather than being merely remembered.
 */
interface UiState {
  mode: Mode
  lang: Lang
  theme: Theme
  setMode: (m: Mode) => void
  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved
  } catch {
    /* private mode / file:// — fall through to English */
  }
  return 'en'
}

/** Mirror theme onto <html>, where the CSS tokens read it. */
function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch {
    /* not fatal — the theme just will not persist */
  }
}

export const useUi = create<UiState>((set, get) => ({
  // The inline boot script in index.html has already set data-theme before
  // first paint; this reads it back rather than deciding again, so React and
  // the CSS can never disagree about which theme is showing.
  mode: 'patient',
  lang: readLang(),
  theme: readTheme(),

  setMode: (mode) => set({ mode }),

  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* not fatal */
    }
    set({ lang })
  },

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))
