import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Field, SELECT_CLASS } from '@/components/shared/Field'
import { loadTrials, type TrialMatch, type TrialSource } from '@/engine/trials'
import { PATIENTS, PHASE_FMT } from '@/data'
import { usePatient } from '@/store/patient'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

const HELP_TYPES = [
  'Transportation to a future appointment',
  'Paying a bill or copay',
  'Food / meal support',
  "Talk to someone about how I'm feeling",
  'Something else',
]

const HELP_WHEN = ['This week', 'Next week', 'Within a month', 'Just planning ahead']

/** The four resource columns, each a list of icon/title/detail/action rows. */
const RESOURCES = [
  {
    key: 'access.t1',
    rows: [
      ['🚌', "Ride to Thursday's appointment", "Cora's Wheels (non-emergency medical transport) · confirmed · picks up 7:45 am", 'Details'],
      ['⛽', 'Mileage reimbursement', 'You may qualify for ~$0.655/mile via Louisiana Cancer Fund program · 92 mi round trip', 'Apply'],
      ['🏨', 'Free lodging near Ochsner BR', 'Hope Lodge-style partner room available if treatment day runs long', 'Check'],
    ],
  },
  {
    key: 'access.t2',
    rows: [
      ['📹', 'Thursday 3:00 pm — Dr. Peters video visit', 'Renee is joining · link opens on any device · works on slow internet (low-bandwidth mode)', 'Join'],
    ],
    note: 'No internet? BayouCare texts you a call-in number — audio-only visits work fine for most follow-ups.',
  },
  {
    key: 'access.t3',
    rows: [
      ['🧾', 'Copay assistance', '2 programs found for your treatment · avg. savings $1,900/yr', 'View'],
      ['🩺', 'Medicaid navigation', 'Step-by-step renewal guide with a caseworker chat line', 'Start'],
    ],
  },
  {
    key: 'access.t4',
    rows: [
      ['👭', 'Support group — Central LA', 'Meets 2nd & 4th Tuesday, 6 pm · Alexandria · childcare on site', 'RSVP'],
      ['🔬', 'Clinical trials — TrialMatch', 'Real NCT trials, eligibility pre-checked with reasons · live below', '↓'],
    ],
  },
]

const CRIT_STYLE: Record<string, string> = {
  yes: 'bg-success-bg text-success-fg',
  no: 'bg-danger-bg text-danger-fg',
  warn: 'bg-warning-bg text-warning-fg',
}
const CRIT_ICON: Record<string, string> = { yes: '✓', no: '✗', warn: '⚠' }

function TrialCard({ t }: { t: TrialMatch }) {
  const tFn = useT()
  const n = t.crits.length
  const pass = t.crits.filter((c) => c.ok === true).length
  const pct = Math.round((pass / n) * 100)
  const barClass = pct >= 70 ? 'bg-brand-500' : pct >= 40 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <b className="text-sm font-semibold text-card-foreground">{t.title}</b>
        <span
          className={cn(
            'flex-none rounded-full px-2.5 py-1 text-[11px] font-bold',
            t.status === 'RECRUITING' ? 'bg-success-bg text-success-fg' : 'bg-warning-bg text-warning-fg',
          )}
        >
          {t.status.replace(/_/g, ' ').toLowerCase()}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {t.nct} · {PHASE_FMT[t.phase] ?? t.phase} · {t.sites.join(' · ')}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {t.crits.map((c, i) => {
          const kind = c.ok === true ? 'yes' : c.ok === false ? 'no' : 'warn'
          return (
            <span
              key={i}
              className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', CRIT_STYLE[kind])}
            >
              {CRIT_ICON[kind]} {c.txt}
            </span>
          )
        })}
      </div>

      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <i
            className={cn('block h-full rounded-full', barClass)}
            style={{ width: `${pct}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            <b className="text-card-foreground">
              {tFn('trial.elig').replace('{p}', String(pct)).replace('{a}', String(pass)).replace('{b}', String(n))}
            </b>
          </span>
          <span className="flex gap-1.5">
            <button
              type="button"
              onClick={() =>
                toast("📨 Question sent to Dr. Peters's team — you'll hear back within 2 business days.")
              }
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              {tFn('trial.ask')}
            </button>
            <button
              type="button"
              onClick={() =>
                toast('🔖 Saved — TrialMatch will re-check eligibility as treatment progresses (e.g., after surgery).')
              }
              className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
            >
              {tFn('trial.save')}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}

export function AccessScreen() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]

  const [helpType, setHelpType] = useState(HELP_TYPES[0])
  const [helpWhen, setHelpWhen] = useState(HELP_WHEN[0])

  const [trials, setTrials] = useState<TrialMatch[]>([])
  const [source, setSource] = useState<TrialSource>('snapshot')

  useEffect(() => {
    let alive = true
    // Don't reach out to clinicaltrials.gov for a patient this module cannot
    // describe — every criterion below is breast-specific.
    if (!patient.trialSet) {
      setTrials([])
      setSource('snapshot')
      return
    }
    void loadTrials().then((r) => {
      if (!alive) return
      setTrials(r.trials)
      setSource(r.source)
    })
    return () => {
      alive = false
    }
  }, [patient])

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">{t('access.head')}</h3>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {t('access.chip')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('access.sub')}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {RESOURCES.map((r) => (
          <section key={r.key} className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
            <h3 className="mb-3 text-base font-semibold text-card-foreground">{t(r.key)}</h3>
            <ul className="flex flex-col gap-2.5">
              {r.rows.map(([ico, h, p, action]) => (
                <li key={h} className="flex items-center gap-3">
                  <span
                    className="flex size-10 flex-none items-center justify-center rounded-md bg-accent text-lg"
                    aria-hidden="true"
                  >
                    {ico}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold text-card-foreground">{h}</b>
                    <p className="text-xs text-muted-foreground">{p}</p>
                  </div>
                  {/* The legacy rendered these as inert <span class="go"> styled
                      like links — a control that did nothing and could not be
                      reached by keyboard. */}
                  <button
                    type="button"
                    onClick={() => toast(`"${action}" — coming up next in the demo.`)}
                    className="flex-none rounded px-2 py-1 text-xs font-bold text-link transition-colors hover:bg-accent"
                  >
                    {action}
                  </button>
                </li>
              ))}
            </ul>
            {r.note && <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>}
          </section>
        ))}
      </div>

      {/* ---------------------------------------------------------- trials */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">{t('trial.head')}</h3>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold',
              source === 'live' && patient.trialSet
                ? 'bg-success-bg text-success-fg'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {source === 'live' && patient.trialSet ? t('trial.live') : t('trial.snapshot')}
          </span>
        </div>

        {!patient.trialSet ? (
          /* Honest, not empty: this patient has no breast-specific profile to
             check the criteria against, and inventing one would be a clinical
             claim about the wrong disease. */
          <p className="text-sm text-muted-foreground">{t('trial.notApplicable')}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t('trial.sub')}</p>
            <p className="mt-2.5 rounded-md border border-border bg-muted px-3 py-2 text-sm text-card-foreground">
              🧩 Matching against:{' '}
              <b>
                {patient.name}, {patient.age} · {patient.stage} {patient.dx.split(',')[0]} ·{' '}
                {patient.subtype} · {patient.city}, LA
              </b>
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {trials.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('trial.empty')}</p>
              ) : (
                trials.map((tr) => <TrialCard key={tr.nct} t={tr} />)
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t('trial.foot')}</p>
          </>
        )}
      </section>

      {/* --------------------------------------------------- request help */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">{t('access.helpHead')}</h3>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            {t('access.helpChip')}
          </span>
        </div>

        {/* The legacy laid these two columns out with an inline
            `grid-template-columns`, which outranks a media query — so they stayed
            2-across on a phone. A responsive grid stacks them now. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What do you need help with?" id="help-type">
            <select
              id="help-type"
              className={SELECT_CLASS}
              value={helpType}
              onChange={(e) => setHelpType(e.target.value)}
            >
              {HELP_TYPES.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="When do you need it by?" id="help-when">
            <select
              id="help-when"
              className={SELECT_CLASS}
              value={helpWhen}
              onChange={(e) => setHelpWhen(e.target.value)}
            >
              {HELP_WHEN.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="button"
          onClick={() =>
            toast(
              `📨 Request sent to Keisha (social worker): "${helpType}" (${helpWhen.toLowerCase()}) — she'll reply within 1 business day.`,
            )
          }
          className="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Send request to Keisha (social worker)
        </button>
      </section>
    </div>
  )
}
