import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Field, SELECT_CLASS } from '@/components/shared/Field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

/** Each criterion's verdict, as a Badge variant. */
const CRIT_BADGE: Record<string, 'success' | 'danger' | 'warning'> = {
  yes: 'success',
  no: 'danger',
  warn: 'warning',
}
const CRIT_ICON: Record<string, string> = { yes: '✓', no: '✗', warn: '⚠' }

function TrialCard({ t }: { t: TrialMatch }) {
  const tFn = useT()
  const n = t.crits.length
  const pass = t.crits.filter((c) => c.ok === true).length
  const pct = Math.round((pass / n) * 100)
  const barClass = pct >= 70 ? 'bg-brand-500' : pct >= 40 ? 'bg-warning' : 'bg-danger'

  return (
    /* Nested inside the trials card, so it keeps the inner `p-4` density. */
    <Card className="p-4">
      <CardHeader>
        <b className="text-sm font-semibold text-card-foreground">{t.title}</b>
        <Badge variant={t.status === 'RECRUITING' ? 'success' : 'warning'}>
          {t.status.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground">
          {t.nct} · {PHASE_FMT[t.phase] ?? t.phase} · {t.sites.join(' · ')}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {t.crits.map((c, i) => {
            const kind = c.ok === true ? 'yes' : c.ok === false ? 'no' : 'warn'
            return (
              /* A criterion is a sentence, so it wraps rather than being
                 clipped by the badge's `overflow-hidden`. */
              <Badge key={i} variant={CRIT_BADGE[kind]} className="whitespace-normal">
                {CRIT_ICON[kind]} {c.txt}
              </Badge>
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
              <Button
                type="button"
                size="sm"
                className="font-bold"
                onClick={() =>
                  toast("📨 Question sent to Dr. Peters's team — you'll hear back within 2 business days.")
                }
              >
                {tFn('trial.ask')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-bold"
                onClick={() =>
                  toast('🔖 Saved — TrialMatch will re-check eligibility as treatment progresses (e.g., after surgery).')
                }
              >
                {tFn('trial.save')}
              </Button>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('access.head')}</CardTitle>
          <Badge variant="success">{t('access.chip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('access.sub')}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {RESOURCES.map((r) => (
          <Card key={r.key}>
            <CardHeader>
              <CardTitle>{t(r.key)}</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => toast(`"${action}" — coming up next in the demo.`)}
                      className="font-bold text-link hover:text-link"
                    >
                      {action}
                    </Button>
                  </li>
                ))}
              </ul>
              {r.note && <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------------------------------------------------------- trials */}
      <Card>
        <CardHeader>
          <CardTitle>{t('trial.head')}</CardTitle>
          <Badge variant={source === 'live' && patient.trialSet ? 'success' : 'neutral'}>
            {source === 'live' && patient.trialSet ? t('trial.live') : t('trial.snapshot')}
          </Badge>
        </CardHeader>

        <CardContent>
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
        </CardContent>
      </Card>

      {/* --------------------------------------------------- request help */}
      <Card>
        <CardHeader>
          <CardTitle>{t('access.helpHead')}</CardTitle>
          <Badge variant="neutral">{t('access.helpChip')}</Badge>
        </CardHeader>

        <CardContent>
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

          <Button
            type="button"
            size="lg"
            className="mt-4 font-bold"
            onClick={() =>
              toast(
                `📨 Request sent to Keisha (social worker): "${helpType}" (${helpWhen.toLowerCase()}) — she'll reply within 1 business day.`,
              )
            }
          >
            Send request to Keisha (social worker)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
