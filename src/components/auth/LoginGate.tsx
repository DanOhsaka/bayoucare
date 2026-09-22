import { useState, type FormEvent } from 'react'
import { useSession } from '@/store/session'
import { useT } from '@/hooks/useT'

/**
 * The five seeded accounts.
 *
 * These are published ON PURPOSE — they are printed on the sign-in card so a
 * judge can get in without being told them. They are not real credentials and
 * the roster they map to is demo data.
 */
const DEMO_ACCOUNTS = [
  { fill: 'patient', name: 'Darlene · in treatment', email: 'patient@bayoucare.demo', pass: 'patient2026' },
  { fill: 'yolanda', name: 'Yolanda · survivorship', email: 'yolanda@bayoucare.demo', pass: 'yolanda2026' },
  { fill: 'priscilla', name: 'Priscilla · in treatment', email: 'priscilla@bayoucare.demo', pass: 'priscilla2026' },
  { fill: 'marcus', name: 'Marcus · survivorship', email: 'marcus@bayoucare.demo', pass: 'marcus2026' },
  { fill: 'clinician', name: 'Clinician · admin, all patients', email: 'clinician@bayoucare.demo', pass: 'clinician2026' },
] as const

export function LoginGate() {
  const t = useT()
  const login = useSession((s) => s.login)
  const busy = useSession((s) => s.busy)
  const errorKey = useSession((s) => s.errorKey)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      useSession.setState({ errorKey: 'login.missing' })
      return
    }
    void login(email, password)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[linear-gradient(160deg,var(--green-900),var(--green-700))] p-6">
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-[400px] rounded-lg border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-lg)]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{t('login.title')}</h3>
          <span className="inline-flex items-center rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            DevDays 2026
          </span>
        </div>

        <p className="text-sm text-muted-foreground">{t('login.sub')}</p>

        <div className="mt-4 flex flex-col gap-1">
          <label htmlFor="bc-email" className="text-sm font-semibold">
            {t('login.email')}
          </label>
          <input
            id="bc-email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-sm border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring"
          />
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label htmlFor="bc-password" className="text-sm font-semibold">
            {t('login.password')}
          </label>
          <input
            id="bc-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-sm border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring"
          />
        </div>

        {/*
          role="alert" + aria-live so a failed sign-in is announced rather than
          being a silent visual change. The element is always present (min-height
          reserves the space) so the layout does not jump when it fills.
        */}
        <p
          role="alert"
          aria-live="polite"
          className="mt-2.5 min-h-[17px] text-sm font-semibold text-danger-fg"
        >
          {errorKey ? t(errorKey) : ''}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? '…' : t('login.submit')}
        </button>

        <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3.5">
          <b className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
            {t('login.demoHead')}
          </b>

          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.fill}
              type="button"
              onClick={() => {
                setEmail(a.email)
                setPassword(a.pass)
              }}
              className="flex flex-col items-start gap-px rounded-sm border border-border bg-card px-2.5 py-1.5 text-left leading-tight transition-colors hover:bg-accent"
            >
              <b className="text-xs font-semibold text-card-foreground">{a.name}</b>
              {/* `text-xs`, not `text-[11px]` — 11px is under the type scale's
                  floor, and this is the one string on the login screen a
                  reviewer has to read character by character to type. */}
              <span className="font-mono text-xs text-muted-foreground">
                {a.email} · {a.pass}
              </span>
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
