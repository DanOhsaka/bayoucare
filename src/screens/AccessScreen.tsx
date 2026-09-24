import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bus,
  Check,
  ExternalLink,
  FlaskConical,
  Fuel,
  Hotel,
  MapPin,
  Receipt,
  Stethoscope,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { AccessCareMap } from '@/components/access/AccessCareMap'
import { BouncyAccordion } from '@/components/motion/bouncy-accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import { Field } from '@/components/shared/Field'
import { ProgressTrack } from '@/components/shared/ProgressTrack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { loadTrials, type TrialMatch, type TrialSource } from '@/engine/trials'
import { PATIENTS, PHASE_FMT } from '@/data'
import { usePatient } from '@/store/patient'
import { useInterp } from '@/hooks/useInterp'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

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
  icon: LucideIcon
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
        icon: Bus,
        title: "Ride to Thursday's appointment",
        detail:
          "Cora's Wheels (non-emergency medical transport) · confirmed · picks up 7:45 am",
        label: 'Details',
        action: 'ride-details',
      },
      {
        icon: Fuel,
        title: 'Mileage reimbursement',
        detail:
          'You may qualify for ~$0.655/mile via Louisiana Cancer Fund program · 92 mi round trip',
        label: 'Apply',
        action: 'mileage-apply',
      },
      {
        icon: Hotel,
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
        icon: Video,
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
        icon: Receipt,
        title: 'Copay assistance',
        detail: '2 programs found for your treatment · avg. savings $1,900/yr',
        label: 'View',
        action: 'copay-view',
      },
      {
        icon: Stethoscope,
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
        icon: Users,
        title: 'Support group, Central LA',
        detail: '2nd and 4th Tuesday at 6 pm in Alexandria. Childcare is available.',
        label: 'RSVP',
        action: 'support-rsvp',
      },
      {
        icon: FlaskConical,
        title: 'Clinical trials near you',
        detail: 'See which studies might fit your care. Details are below.',
        label: 'View',
        action: 'trials-jump',
      },
    ],
  },
]

const CRIT_TONE: Record<
  'yes' | 'no' | 'warn',
  { box: string; Icon: LucideIcon }
> = {
  yes: {
    box: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    Icon: Check,
  },
  no: {
    box: 'border-destructive/30 bg-destructive/10 text-destructive',
    Icon: X,
  },
  warn: {
    box: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    Icon: AlertTriangle,
  },
}

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

function cityOf(site: string): string {
  const parts = site.split(',').map((p) => p.trim()).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1]! : site
}

/** Compact Louisiana sites: a few names + Maps link, not a wall of · separators. */
function TrialSites({
  sites,
  nct,
  whereLabel,
}: {
  sites: string[]
  nct: string
  whereLabel: string
}) {
  const preview = sites.slice(0, 3)
  const more = Math.max(0, sites.length - preview.length)
  const cities = [...new Set(sites.map(cityOf))]
  const mapsQuery =
    sites.length === 1
      ? sites[0]!
      : `${preview.join(' · ')}${more ? ` +${more} more` : ''} · Louisiana clinical trial ${nct}`
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {whereLabel}
      </p>
      <p className="mt-1 text-sm font-semibold text-card-foreground">
        {sites.length === 1
          ? '1 clinic'
          : `${sites.length} clinics`}
        {cities.length > 0 ? (
          <span className="font-normal text-muted-foreground">
            {' '}
            · {cities.slice(0, 4).join(', ')}
            {cities.length > 4 ? ` +${cities.length - 4}` : ''}
          </span>
        ) : null}
      </p>
      <ul className="mt-2 space-y-1">
        {preview.map((site) => (
          <li key={site} className="flex gap-2 text-sm text-card-foreground">
            <MapPin
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
              strokeWidth={1.75}
            />
            <span className="min-w-0 leading-snug">{site}</span>
          </li>
        ))}
      </ul>
      {more > 0 ? (
        <p className="mt-1.5 pl-[1.375rem] text-xs text-muted-foreground">
          +{more} more {more === 1 ? 'site' : 'sites'}
        </p>
      ) : null}
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
      >
        View on Google Maps
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2} />
      </a>
    </div>
  )
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
        <TrialSites sites={trial.sites} nct={trial.nct} whereLabel={t('trial.where')} />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('trial.compare')}
          </p>
          <ul className="flex flex-col gap-2">
            {trial.crits.map((c, i) => {
              const kind = c.ok === true ? 'yes' : c.ok === false ? 'no' : 'warn'
              const { box, Icon } = CRIT_TONE[kind]
              return (
                <li key={i}>
                  <div
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm leading-relaxed',
                      box,
                    )}
                  >
                    <Icon
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                      strokeWidth={2.25}
                    />
                    <span className="min-w-0 flex-1 font-medium">{c.txt}</span>
                  </div>
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
  /** Only one help select open at a time — panels stack in the same card. */
  const [helpOpen, setHelpOpen] = useState<'type' | 'when' | null>(null)
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
            <CardContent className="space-y-3">
              <BouncyAccordion
                defaultValue={r.rows[0]?.title ?? null}
                items={r.rows.map((row) => {
                  const Icon = row.icon
                  return {
                    id: row.title,
                    title: row.title,
                    icon: <Icon className="size-4" aria-hidden="true" strokeWidth={1.75} />,
                    description: (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">{row.detail}</p>
                        <Button
                          type="button"
                          size="sm"
                          className="w-fit font-semibold"
                          onClick={() => onResourceAction(row.action)}
                        >
                          {row.label}
                        </Button>
                      </div>
                    ),
                  }
                })}
              />
              {r.note ? <p className="text-xs text-muted-foreground">{r.note}</p> : null}
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
              <Select
                id="help-type"
                value={helpType}
                onValueChange={setHelpType}
                open={helpOpen === 'type'}
                onOpenChange={(open) => setHelpOpen(open ? 'type' : null)}
              >
                <SelectTrigger className="h-11 text-sm font-medium lg:h-10">
                  <SelectValue className="min-w-0 truncate" />
                </SelectTrigger>
                <SelectContent>
                  {HELP_TYPES.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="When do you need it by?" id="help-when">
              <Select
                id="help-when"
                value={helpWhen}
                onValueChange={setHelpWhen}
                open={helpOpen === 'when'}
                onOpenChange={(open) => setHelpOpen(open ? 'when' : null)}
              >
                <SelectTrigger className="h-11 text-sm font-medium lg:h-10">
                  <SelectValue className="min-w-0 truncate" />
                </SelectTrigger>
                <SelectContent>
                  {HELP_WHEN.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-4 font-bold"
            onClick={() =>
              toast(
                `Request sent to Keisha (social worker): "${helpType}" (${helpWhen.toLowerCase()}) — she'll reply within 1 business day.`,
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
