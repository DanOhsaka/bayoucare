import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Map,
  MessageCircle,
  Route,
  Stethoscope,
  Users,
} from 'lucide-react'

import { Stagger, StaggerItem } from '@/components/shared/Motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { buildPlan, describeAppointment, fmtDay, nextAppointment } from '@/lib/calendar'
import { factorsFor, stateOf } from '@/engine/team/risk'
import { useInterp } from '@/hooks/useInterp'
import { useT } from '@/hooks/useT'
import { useCheckins } from '@/store/checkins'
import { useActivePatient, usePatient } from '@/store/patient'
import { useSession } from '@/store/session'
import { TEAM_PATIENTS, useTeam } from '@/store/team'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'
import { cn } from '@/lib/utils'

const RIDE_PROVIDER = "Cora's Wheels"

function greetingHour(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function PatientHome() {
  const t = useT()
  const ti = useInterp()
  const navigate = useNavigate()
  const lang = useUi((s) => s.lang)
  const patient = useActivePatient()
  const profileComplete = usePatient((s) => s.profileComplete)
  const checkinCount = useCheckins((s) => s.checkinCount)
  const summary = useCheckins((s) => s.summary)

  const next = useMemo(() => nextAppointment(buildPlan(patient)), [patient])
  const appt = next ? describeAppointment(next, patient.calTypes) : null
  const todaysCheckinDone = checkinCount > 0 && summary != null

  const shortcuts: Array<{
    to: string
    label: string
    icon: typeof ClipboardList
    primary?: boolean
  }> = [
    {
      to: '/my-care/checkins',
      label: todaysCheckinDone ? t('overview.checkinDone') : t('home.checkinBtn'),
      icon: ClipboardList,
      primary: !todaysCheckinDone,
    },
    { to: '/my-care/calendar', label: t('side.calendar'), icon: CalendarDays },
    { to: '/my-care/remi', label: t('overview.askRemi'), icon: MessageCircle },
    { to: '/my-care/family', label: t('side.family'), icon: Users },
    { to: '/my-plan', label: t('nav.myplan'), icon: Route },
    { to: '/my-care/home', label: t('overview.openCare'), icon: HeartPulse },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {t(`overview.${greetingHour()}`)}
            </p>
            <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-foreground font-display sm:text-3xl">
              {ti('home.greet')}
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm text-muted-foreground">{t('home.sub')}</p>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success-fg">
            {patient.chip}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">{t('home.nextup')}</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigate('/my-care/calendar')}
            >
              {t('side.calendar')}
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
            {appt && next ? (
              <>
                <span className="inline-flex max-w-full items-start gap-1.5 rounded-full bg-warning-bg px-3 py-1.5 text-xs font-semibold leading-snug text-warning-fg">
                  {(() => {
                    const Icon = appt.icon
                    return (
                      <Icon
                        aria-hidden="true"
                        className="mt-0.5 size-3.5 shrink-0"
                        strokeWidth={2}
                      />
                    )
                  })()}
                  <span className="min-w-0 break-words">
                    {fmtDay(next.date, lang)} {next.time} — {appt.label} ({appt.site})
                  </span>
                </span>
                {next.ride ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1.5 text-xs font-semibold text-success-fg">
                    {t('home.rideReady')} — {RIDE_PROVIDER}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{t('home.noneScheduled')}</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t('overview.shortcuts')}</h2>
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <StaggerItem key={s.to}>
              <Link
                to={s.to}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-border p-4 transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:-translate-y-0.5',
                  s.primary
                    ? 'border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary/90'
                    : 'bg-card text-card-foreground shadow-[var(--shadow-sm)] hover:border-border-strong hover:shadow-[var(--shadow)]',
                )}
              >
                <s.icon className="size-5 shrink-0 opacity-90" aria-hidden="true" />
                <span className="text-sm font-semibold">{s.label}</span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-card-foreground">{t('overview.journeyHead')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {profileComplete && patient.dx
                ? `${patient.dx} · ${patient.stage}`
                : 'Set up your health profile in My Plan to personalize your care path.'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/my-plan">{profileComplete ? t('overview.viewPlan') : 'Set up My Plan'}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ClinicianHome() {
  const t = useT()
  const navigate = useNavigate()
  const email = useSession((s) => s.email)
  const setMode = useUi((s) => s.setMode)
  const applied = useTeam((s) => s.applied)
  const alerts = useVitals((s) => s.alerts)

  const flagged = useMemo(() => {
    return TEAM_PATIENTS.map((p) => {
      const s = stateOf(factorsFor(p.f, applied[p.id] ?? new Set()))
      return { p, state: s }
    })
      .filter((x) => x.state.level !== 'none')
      .sort((a, b) => b.state.cur - a.state.cur)
  }, [applied])

  const shortcuts = [
    { to: '/care-team', label: t('overview.openTeam'), icon: Users, mode: 'admin' as const },
    { to: '/clinic-ops', label: t('overview.openOps'), icon: Activity, mode: 'admin' as const },
    { to: '/survivorship', label: t('overview.openSurv'), icon: Stethoscope, mode: 'admin' as const },
    { to: '/population', label: t('overview.openPop'), icon: Map, mode: 'admin' as const },
    { to: '/my-care/home', label: t('overview.patientDemo'), icon: HeartPulse, mode: 'patient' as const },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t('overview.clinicianKicker')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground font-display sm:text-3xl">
          {t('overview.clinicianGreet')}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {t('overview.clinicianSub')}
          {email ? (
            <>
              {' '}
              <span className="font-medium text-foreground">{email}</span>
            </>
          ) : null}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="text-2xl font-semibold tabular-nums text-foreground">{alerts.length}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">
              {t('overview.needsAttention')}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="text-2xl font-semibold tabular-nums text-foreground">{flagged.length}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">
              {t('overview.flagged')}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="text-2xl font-semibold tabular-nums text-foreground">
              {TEAM_PATIENTS.length}
            </div>
            <div className="mt-1 text-xs font-medium text-muted-foreground">{t('overview.ward')}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardContent>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-card-foreground">
                {t('overview.needsAttention')}
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setMode('admin')
                  navigate('/care-team')
                }}
              >
                {t('overview.openTeam')}
              </Button>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('overview.noAlerts')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alerts.slice(0, 4).map((a, i) => (
                  <li
                    key={`${a.name}-${a.when}-${i}`}
                    className="rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.when}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.msg}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-card-foreground">{t('overview.flagged')}</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setMode('admin')
                  navigate('/care-team')
                }}
              >
                {t('nav.team')}
              </Button>
            </div>
            {flagged.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('overview.noFlagged')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {flagged.slice(0, 5).map(({ p, state }) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.checkin}</div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                        state.level === 'critical'
                          ? 'bg-danger-bg text-danger-fg'
                          : 'bg-warning-bg text-warning-fg',
                      )}
                    >
                      {state.cur}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t('overview.shortcuts')}</h2>
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <StaggerItem key={s.to}>
              <button
                type="button"
                onClick={() => {
                  setMode(s.mode)
                  navigate(s.to)
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border-strong hover:shadow-[var(--shadow)] motion-safe:hover:-translate-y-0.5"
              >
                <s.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-card-foreground">{s.label}</span>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}

/**
 * Signed-in Home — personal dashboard, not the public marketing page.
 * Marketing lives on the logged-out Landing only.
 */
export function OverviewScreen() {
  const role = useSession((s) => s.role)
  return role === 'clinician' ? <ClinicianHome /> : <PatientHome />
}
