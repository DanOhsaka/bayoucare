import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { AccessCareMap } from '@/components/access/AccessCareMap'
import { Field, SELECT_CLASS } from '@/components/shared/Field'
import { ProgressTrack } from '@/components/shared/ProgressTrack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { loadTrials, type TrialMatch, type TrialSource } from '@/engine/trials'
import { PATIENTS, PHASE_FMT } from '@/data'
import { usePatient } from '@/store/patient'
import { useInterp } from '@/hooks/useInterp'
import { useT } from '@/hooks/useT'

const HELP_TYPES = [
  'Transportation to a future appointment',
  'Paying a bill or copay',
  'Food / meal support',
  "Talk to someone about how I'm feeling",
  'Something else',
] as const

const HELP_WHEN = ['This week', 'Next week', 'Within a month', 'Just planning ahead'] as const

type ResourceAction =
  | 'ride-details'
  | 'mileage-apply'
  | 'lodging-check'
  | 'telehealth-join'
  | 'copay-view'
  | 'medicaid-start'
  | 'support-rsvp'
  | 'trials-jump'

type ResourceRow = {
  ico: string
  title: string
  detail: string
  label: string
  action: ResourceAction
}

/** The four resource columns — each action routes somewhere real in the app. */
const RESOURCES: Array<{ key: string; note?: string; rows: ResourceRow[] }> = [
  {
    key: 'access.t1',
    rows: [
      {
        ico: '🚌',
        title: "Ride to Thursday's appointment",
        detail:
          "Cora's Wheels (non-emergency medical transport) · confirmed · picks up 7:45 am",
        label: 'Details',
        action: 'ride-details',
      },
      {
        ico: '⛽',
        title: 'Mileage reimbursement',
        detail:
          'You may qualify for ~$0.655/mile via Louisiana Cancer Fund program · 92 mi round trip',
        label: 'Apply',
        action: 'mileage-apply',
      },
      {
        ico: '🏨',
        title: 'Free lodging near Ochsner BR',
        detail: 'Hope Lodge-style partner room available if treatment day runs long',
        label: 'Check',
        action: 'lodging-check',
      },
    ],
  },
  {
    key: 'access.t2',
    note: 'No internet? BayouCare texts you a call-in number — audio-only visits work fine for most follow-ups.',
    rows: [
      {
        ico: '📹',
        title: 'Thursday 3:00 pm — Dr. Peters video visit',
        detail:
          'Renee is joining · link opens on any device · works on slow internet (low-bandwidth mode)',
        label: 'Join',
        action: 'telehealth-join',
      },
    ],
  },
  {
    key: 'access.t3',
    rows: [
      {
        ico: '🧾',
        title: 'Copay assistance',
        detail: '2 programs found for your treatment · avg. savings $1,900/yr',
        label: 'View',
        action: 'copay-view',
      },
      {
        ico: '🩺',
        title: 'Medicaid navigation',
        detail: 'Step-by-step renewal guide with a caseworker chat line',
        label: 'Start',
        action: 'medicaid-start',
      },
    ],
  },
  {
    key: 'access.t4',
    rows: [
      {
        ico: '👭',
        title: 'Support group, Central LA',
        detail: '2nd and 4th Tuesday at 6 pm in Alexandria. Childcare is available.',
        label: 'RSVP',
        action: 'support-rsvp',
      },
      {
        ico: '🔬',
        title: 'Clinical trials near you',
        detail: 'See which studies might fit your care. Details are below.',
        label: 'View',
        action: 'trials-jump',
      },
    ],
  },
]

const CRIT_BADGE: Record<string, 'success' | 'danger' | 'warning'> = {
  yes: 'success',
  no: 'danger',
  warn: 'warning',
}
const CRIT_ICON: Record<string, string> = { yes: '✓', no: '✗', warn: '⚠' }

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function statusLabel(
  status: string,
  t: (key: string) => string,
): { label: string; variant: 'success' | 'warning' | 'neutral' } {
  if (status === 'RECRUITING') return { label: t('trial.statusOpen'), variant: 'success' }
  if (status === 'COMPLETED') return { label: t('trial.statusClosed'), variant: 'warning' }
  if (status === 'ACTIVE_NOT_RECRUITING') return { label: t('trial.statusOngoing'), variant: 'warning' }
  return { label: status.replace(/_/g, ' ').toLowerCase(), variant: 'neutral' }
}

function TrialCard({ trial }: { trial: TrialMatch }) {
  const t = useT()
  const ti = useInterp()
  const n = trial.crits.length
  const pass = trial.crits.filter((c) => c.ok === true).length
  const pct = Math.round((pass / n) * 100)
  const status = statusLabel(trial.status, t)

  return (
    <Card className="p-4">
      <CardHeader className="items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold leading-snug text-card-foreground">{trial.title}</p>
          <p className="text-xs text-muted-foreground">
            {ti('trial.studyId', { nct: trial.nct })}
            {PHASE_FMT[trial.phase] ? ` · ${PHASE_FMT[trial.phase]}` : ''}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('trial.where')}
          </p>
          <p className="mt-1 text-sm text-card-foreground">{trial.sites.join(' · ')}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('trial.compare')}
          </p>
          <ul className="flex flex-col gap-2">
            {trial.crits.map((c, i) => {
              const kind = c.ok === true ? 'yes' : c.ok === false ? 'no' : 'warn'
              return (
                <li key={i}>
                  <Badge variant={CRIT_BADGE[kind]} className="w-full justify-start whitespace-normal text-left">
                    <span className="mr-1.5 font-bold" aria-hidden="true">
                      {CRIT_ICON[kind]}
                    </span>
                    {c.txt}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <ProgressTrack
            pct={pct}
            tone={pct >= 70 ? 'brand' : pct >= 40 ? 'warning' : 'danger'}
          />
          <p className="mt-2 text-sm text-card-foreground">
            {ti('trial.elig', { p: pct, a: pass, b: n })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="font-bold"
            onClick={() => toast(t('trial.askToast'))}
          >
            {t('trial.ask')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-bold"
            onClick={() => toast(t('trial.saveToast'))}
          >
            {t('trial.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AccessScreen() {
  const t = useT()
  const ti = useInterp()
  const navigate = useNavigate()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]

  const [helpType, setHelpType] = useState<string>(HELP_TYPES[0])
  const [helpWhen, setHelpWhen] = useState<string>(HELP_WHEN[0])
  const helpRef = useRef<HTMLDivElement>(null)

  const [trials, setTrials] = useState<TrialMatch[]>([])
  const [source, setSource] = useState<TrialSource>('snapshot')

  useEffect(() => {
    let alive = true
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

  function openHelp(type: string, when: string = HELP_WHEN[0]) {
    setHelpType(type)
    setHelpWhen(when)
    window.requestAnimationFrame(() => {
      scrollToId('access-help')
      document.getElementById('help-type')?.focus()
    })
  }

  function onResourceAction(action: ResourceAction) {
    switch (action) {
      case 'ride-details':
        navigate('/my-care/calendar?focus=ride')
        break
      case 'mileage-apply':
        openHelp('Transportation to a future appointment', 'Within a month')
        toast('Mileage assistance — tell Keisha the trip details below.')
        break
      case 'lodging-check':
        scrollToId('access-map')
        toast(
          'Lodging partners sit near major treatment centers — browse clinics on the map, then request lodging with Keisha if you need a room.',
        )
        break
      case 'telehealth-join':
        toast.success('Joining Dr. Peters’ video visit — low-bandwidth mode is on.')
        navigate('/my-care/calendar')
        break
      case 'copay-view':
        openHelp('Paying a bill or copay', 'This week')
        toast('Copay programs — send a request to Keisha to start the paperwork.')
        break
      case 'medicaid-start':
        openHelp('Paying a bill or copay', 'Next week')
        toast('Medicaid navigation — Keisha can walk renewal with you from the form below.')
        break
      case 'support-rsvp':
        toast.success('RSVP sent — Central LA support group, 2nd & 4th Tuesday at 6 pm.')
        break
      case 'trials-jump':
        scrollToId('access-trials')
        break
    }
  }

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

      <div id="access-map" className="scroll-mt-24">
        <AccessCareMap patientId={pid} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {RESOURCES.map((r) => (
          <Card key={r.key}>
            <CardHeader>
              <CardTitle>{t(r.key)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2.5">
                {r.rows.map((row) => (
                  <li key={row.title} className="flex items-center gap-3">
                    <span
                      className="flex size-10 flex-none items-center justify-center rounded-md bg-accent text-lg"
                      aria-hidden="true"
                    >
                      {row.ico}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm font-semibold text-card-foreground">{row.title}</b>
                      <p className="text-xs text-muted-foreground">{row.detail}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onResourceAction(row.action)}
                      className="font-bold text-link hover:text-link"
                    >
                      {row.label}
                    </Button>
                  </li>
                ))}
              </ul>
              {r.note && <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card id="access-trials" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>{t('trial.head')}</CardTitle>
          <Badge variant={source === 'live' && patient.trialSet ? 'success' : 'neutral'}>
            {source === 'live' && patient.trialSet ? t('trial.live') : t('trial.snapshot')}
          </Badge>
        </CardHeader>

        <CardContent>
          {!patient.trialSet ? (
            <p className="text-sm text-muted-foreground">{t('trial.notApplicable')}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{ti('trial.sub')}</p>
              <div className="mt-3 rounded-md border border-border bg-muted/60 px-3.5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('trial.profileLabel')}
                </p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">
                  {patient.name}, {patient.age}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {patient.stage} {patient.dx.split(',')[0]}
                  {patient.subtype ? ` · ${patient.subtype}` : ''}
                  {patient.city ? ` · ${patient.city}, LA` : ''}
                </p>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {trials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('trial.empty')}</p>
                ) : (
                  trials.map((tr) => <TrialCard key={tr.nct} trial={tr} />)
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t('trial.foot')}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card id="access-help" ref={helpRef} className="scroll-mt-24">
        <CardHeader>
          <CardTitle>{t('access.helpHead')}</CardTitle>
          <Badge variant="neutral">{t('access.helpChip')}</Badge>
        </CardHeader>

        <CardContent>
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
