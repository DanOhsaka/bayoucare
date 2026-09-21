import { Leaf, LogOut, Moon, Sun } from 'lucide-react'
import { NavTabs } from '@/components/layout/NavTabs'
import { LANGS, LANG_LABELS, type Lang } from '@/lib/i18n'
import { useT } from '@/hooks/useT'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

const CONTROL =
  'flex h-[34px] flex-none items-center gap-2 rounded-sm border border-white/25 bg-white/10 px-2 text-xs font-semibold text-on-dark transition-colors hover:bg-white/20'

/**
 * The application chrome.
 *
 * Three gates live here, all of them load-bearing:
 *
 *  - The **mode switch** is hidden from patient accounts. Without that, a
 *    patient account could click "Admin" and read the god-view, which would make
 *    signing in decoration rather than a gate.
 *  - The **patient picker** is keyed on ROLE, not mode, on purpose: a clinician
 *    who flips to Patient mode should still be able to choose whose patient app
 *    they are looking at. That is the best demo in the feature. A patient never
 *    gets one.
 *  - The **identity pill** shows session identity (email), which is a different
 *    concept from patient identity (whose record is displayed).
 */
export function TopBar() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const setMode = useUi((s) => s.setMode)
  const theme = useUi((s) => s.theme)
  const toggleTheme = useUi((s) => s.toggleTheme)
  const lang = useUi((s) => s.lang)
  const setLang = useUi((s) => s.setLang)

  const role = useSession((s) => s.role)
  const email = useSession((s) => s.email)
  const logout = useSession((s) => s.logout)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-[60px] items-center gap-2 px-5',
        mode === 'admin' ? 'bg-brand-800' : 'bg-brand-900',
      )}
    >
      <div className="mr-1 flex flex-none items-center gap-2 text-on-dark">
        <Leaf className="size-[18px]" aria-hidden="true" />
        <b className="text-[15px] font-bold tracking-tight">BayouCare</b>
      </div>

      {role === 'clinician' && (
        <div
          role="group"
          aria-label="Mode"
          className="mr-1 hidden flex-none items-center rounded-md bg-white/10 p-0.5 sm:flex"
        >
          {(['patient', 'admin'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-[5px] px-2.5 py-1 text-xs font-bold transition-colors',
                mode === m ? 'bg-white/90 text-brand-900' : 'text-on-dark-muted hover:text-on-dark',
              )}
            >
              {m === 'patient' ? 'Patient' : 'Admin'}
            </button>
          ))}
        </div>
      )}

      <NavTabs />

      <div className="ml-auto flex flex-none items-center gap-2">
        <label className="sr-only" htmlFor="bc-lang">
          Language
        </label>
        <select
          id="bc-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className={cn(CONTROL, 'px-2')}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {LANG_LABELS[l]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleTheme}
          className={cn(CONTROL, 'w-[34px] justify-center')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light' : 'Dark'}
        >
          {theme === 'dark' ? (
            <Sun className="size-4" aria-hidden="true" />
          ) : (
            <Moon className="size-4" aria-hidden="true" />
          )}
        </button>

        <div className="hidden items-center gap-1.5 rounded-sm border border-white/25 bg-white/10 pl-2.5 pr-1 md:flex">
          <span className="max-w-[128px] truncate text-xs text-on-dark" title={email}>
            {email}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-xs font-bold text-on-dark transition-colors hover:bg-white/25"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            {t('login.signOut')}
          </button>
        </div>
      </div>
    </header>
  )
}
