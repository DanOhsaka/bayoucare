import { LogOut, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { MobileNav } from '@/components/layout/MobileNav'
import { NavTabs } from '@/components/layout/NavTabs'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { LANG_TOAST, PATIENTS, type PatientId } from '@/data'
import { LANGS, LANG_LABELS, type Lang } from '@/lib/i18n'
import { useT } from '@/hooks/useT'
import { usePatient } from '@/store/patient'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

const PATIENT_IDS = Object.keys(PATIENTS) as PatientId[]

/*
 * 44px below `lg`, the designed 34px above it.
 *
 * 34px was sized against the header's own row, not against a thumb — and this
 * is the app's only navigation, language and sign-out control on a phone, so
 * it was the whole chrome that was under-sized. `lg:h-[34px]`/`lg:w-[34px]`
 * keeps the desktop bar byte-identical, which also means the header height at
 * `lg` does not move and the sidebar's sticky offset stays correct.
 */
const CONTROL =
  'flex h-11 flex-none items-center gap-2 rounded-sm border border-white/25 bg-white/10 px-2.5 text-xs font-semibold text-on-dark transition-colors duration-200 ease-out hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0 lg:h-[34px]'

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
 *
 * Layout: brand + chrome stay on one row. Clinician tools (mode + patient) sit
 * inline from `lg` up; below that they get their own full-width row so they
 * cannot wrap into a right-ragged strip under empty space.
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

  // Patient IDENTITY — whose record is on screen — which the header doc above
  // is careful to distinguish from session identity (the email pill).
  const pid = usePatient((s) => s.pid)
  const setPatient = usePatient((s) => s.setPatient)

  const isClinician = role === 'clinician'

  function modeSwitch() {
    return (
      <div
        role="group"
        aria-label="Mode"
        className="flex h-11 flex-none items-center rounded-md bg-white/10 p-0.5 lg:h-[34px]"
      >
        {(['patient', 'admin'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              // Same height as chrome controls (`h-11` / `lg:h-[34px]`), so the
              // mode switch and patient picker share one baseline on both rows.
              'h-full rounded-[5px] px-3 text-xs font-bold transition-colors duration-200 ease-out',
              mode === m ? 'bg-white/90 text-brand-900' : 'text-on-dark-muted hover:text-on-dark',
            )}
          >
            {m === 'patient' ? 'Patient' : 'Admin'}
          </button>
        ))}
      </div>
    )
  }

  /*
   * The patient picker this header documents above, which was designed,
   * written up as "the best demo in the feature" — and then never ported.
   * `setPatient` sat in the store called from nowhere, so a clinician
   * account was pinned to one record.
   *
   * It lists the bundled roster rather than `GET /api/patients`, because
   * every patient screen renders from `PATIENTS[pid]`; a picker sourced
   * anywhere else could offer a record the app is unable to display.
   * Patients never see it, the same gate as the mode switch above.
   */
  function patientSelect(id: string, className?: string) {
    return (
      <>
        <label className="sr-only" htmlFor={id}>
          Viewing as patient
        </label>
        <select
          id={id}
          title="Viewing as patient"
          value={pid}
          onChange={(e) => setPatient(e.target.value as PatientId)}
          className={cn(CONTROL, 'min-w-0 px-2.5', className)}
        >
          {PATIENT_IDS.map((patientId) => (
            <option key={patientId} value={patientId}>
              {PATIENTS[patientId].name}
            </option>
          ))}
        </select>
      </>
    )
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex flex-col gap-3 px-4 py-2.5 sm:px-5',
        mode === 'admin' ? 'bg-brand-800' : 'bg-brand-900',
      )}
    >
      {/*
       * Primary row. Wraps rather than clipping so `NavTabs` can take its own
       * full-width line between `md` and `lg` (see that component). The chrome
       * cluster is `flex-none` + `ml-auto` and never includes the patient
       * picker, so language / theme / sign-out stay beside the brand.
       */}
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 lg:min-h-0">
        <div className="flex flex-none items-center text-on-dark">
          {/*
            Logo lockup includes the wordmark; sit it on a light plate so the
            cream artboard reads cleanly on the dark brand header.
          */}
          <BrandLogo
            size="sm"
            className="rounded-md bg-white/95 px-1.5 py-0.5 shadow-[var(--shadow-sm)]"
          />
        </div>

        {isClinician && (
          <div className="hidden items-center gap-2 lg:flex">
            {modeSwitch()}
            {patientSelect('bc-patient-lg', 'w-[13rem]')}
          </div>
        )}

        <NavTabs />

        <div className="ml-auto flex flex-none items-center gap-2.5">
          {/* Below `md` this is the whole of the app's navigation; from `md` up it
              hides itself and `NavTabs` takes over. First in the group so the
              reading order is navigate → language → theme → sign out. */}
          <MobileNav />

          <label className="sr-only" htmlFor="bc-lang">
            Language
          </label>
          <select
            id="bc-lang"
            value={lang}
            onChange={(e) => {
              const next = e.target.value as Lang
              setLang(next)
              toast(LANG_TOAST[next] ?? LANG_TOAST.en)
            }}
            className={cn(CONTROL, 'px-2.5')}
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
            className={cn(CONTROL, 'w-11 justify-center px-0 lg:w-[34px]')}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light' : 'Dark'}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </button>

          {/*
              The email pill is ~232px, which does not fit a phone beside anything
              else — it stays a `md:` affordance.

              The truncation cap is wider below `lg` because `title` is the only
              other place the full address exists, and `title` is a hover
              affordance: on the tablet this pill is shown to, the address was
              permanently unreadable past the 17th character. 180px holds the
              demo addresses in full at `text-xs`, so the truncation simply stops
              happening at the widths where hovering is not available. It returns
              to the designed 128px at `lg`, keeping the desktop pill's width.
          */}
          <div className="hidden items-center gap-1.5 rounded-sm border border-white/25 bg-white/10 pl-2.5 pr-1 md:flex">
            <span className="max-w-[180px] truncate text-xs text-on-dark lg:max-w-[128px]" title={email}>
              {email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              // ~25px at py-1; `min-h-11` below `lg` for the same reason the
              // chrome controls got it. `lg:min-h-0` restores the pill's height.
              className="flex min-h-11 items-center gap-1.5 rounded-[5px] px-2 py-1 text-xs font-bold text-on-dark transition-colors duration-200 ease-out hover:bg-white/25 lg:min-h-0"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              {t('login.signOut')}
            </button>
          </div>

          {/*
           * Below md the pill above is hidden, and this is the ONLY sign-out
           * control in the app — the audit found it was `hidden md:flex`, so on
           * every phone there was no way to sign out at all. Icon-only with an
           * accessible name, at the same size as the theme toggle.
           */}
          <button
            type="button"
            onClick={() => void logout()}
            aria-label={t('login.signOut')}
            title={t('login.signOut')}
            className={cn(CONTROL, 'w-11 justify-center px-0 md:hidden lg:w-[34px]')}
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/*
       * Clinician tools below `lg`: one full-width strip aligned to the same
       * left/right edges as the brand + chrome row above. Mode is auto-width;
       * the patient picker takes the remaining space so the row does not end
       * in a short orphan dropdown with empty green beside it.
       */}
      {isClinician && (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:hidden">
          {modeSwitch()}
          {patientSelect('bc-patient-sm', 'w-full')}
        </div>
      )}
    </header>
  )
}
