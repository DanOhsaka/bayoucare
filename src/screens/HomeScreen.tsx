import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Car, ClipboardList, MessageCircle, Pill, Receipt, Stethoscope } from 'lucide-react'

import { FamilyHelpPanel } from '@/components/patient/FamilyHelpPanel'
import { type CareTeamMember } from '@/data'
import { buildPlan, describeAppointment, fmtDay, nextAppointment } from '@/lib/calendar'
import { careMemberSlug, threadKey, useCareChat } from '@/store/careChat'
import { UnreadCount } from '@/components/shared/UnreadCount'
import { useInterp } from '@/hooks/useInterp'
import { useActivePatient, usePatient } from '@/store/patient'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'

/** The ride provider named on the Home card. Set in the legacy app too. */
const RIDE_PROVIDER = "Cora's Wheels"

/** Icons for the care-team rows, cycled if a record has more than three. */
const TEAM_ICONS = [Stethoscope, Pill, Receipt]

function teamSubtitle(m: CareTeamMember): string {
  const extra = m.org ?? m.note
  return extra ? `${m.role} · ${extra}` : m.role
}

export function HomeScreen() {
  const t = useT()
  const ti = useInterp()
  const navigate = useNavigate()
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = useActivePatient()
  const unread = useCareChat((s) => s.unread)

  const next = useMemo(() => nextAppointment(buildPlan(patient)), [patient])
  const appt = next ? describeAppointment(next, patient.calTypes) : null

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* ------------------------------------------------------------ greeting */}
      <section className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow)] sm:p-6">
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
          <h3 className="min-w-0 text-balance text-base font-semibold text-card-foreground sm:text-lg">
            {ti('home.greet')}
          </h3>
          <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {patient.chip}
          </span>
        </div>

        <p className="mt-2 text-pretty text-sm text-muted-foreground">{t('home.sub')}</p>

        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h4 className="text-base font-semibold text-card-foreground">{t('home.nextup')}</h4>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap">
            <Link
              to="/my-care/calendar"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-brand-600 px-3.5 text-sm font-bold text-link transition-colors hover:bg-accent sm:w-auto lg:h-9"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {t('side.calendar')}
            </Link>
            <Link
              to="/my-care/checkins"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto lg:h-9"
            >
              <ClipboardList className="size-4" aria-hidden="true" />
              {t('home.checkinBtn')}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap">
            {appt && next ? (
              <>
                <span className="inline-flex max-w-full items-start gap-1.5 rounded-full bg-warning-bg px-3 py-1.5 text-xs font-bold leading-snug text-warning-fg sm:items-center">
                  {(() => {
                    const Icon = appt.icon
                    return (
                      <Icon
                        aria-hidden="true"
                        className="mt-0.5 size-3.5 shrink-0 sm:mt-0"
                        strokeWidth={2}
                      />
                    )
                  })()}
                  <span className="min-w-0 break-words">
                    {fmtDay(next.date, lang)} {next.time} — {appt.label} ({appt.site})
                  </span>
                </span>
                {next.ride && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1.5 text-xs font-bold text-success-fg">
                    <Car aria-hidden="true" className="size-3.5" strokeWidth={2} />
                    {t('home.rideReady')} — {RIDE_PROVIDER}
                  </span>
                )}
              </>
            ) : (
            <span className="text-sm text-muted-foreground">{t('home.noneScheduled')}</span>
          )}
        </div>
      </section>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* --------------------------------------------------------- care team */}
        <section className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow)] sm:p-6">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-card-foreground">{t('home.teamHead')}</h3>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {patient.careTeam.length} {t('home.members')}
            </span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {patient.careTeam.map((m, i) => {
              const Icon = TEAM_ICONS[i % TEAM_ICONS.length]
              const count = unread[threadKey(pid, careMemberSlug(m.name))] ?? 0
              return (
                <li key={m.name}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/my-care/messages?with=${careMemberSlug(m.name)}`)
                    }
                    className="flex w-full items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative flex size-10 flex-none items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="size-[18px]" aria-hidden="true" />
                      {count > 0 && (
                        <span className="absolute -right-1 -top-1">
                          <UnreadCount count={count} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <b className="block truncate text-sm font-semibold text-card-foreground">{m.name}</b>
                      <p className="truncate text-xs text-muted-foreground">
                        {teamSubtitle(m)}
                      </p>
                    </div>
                    <span className="flex flex-none items-center gap-1.5 text-xs font-bold text-link">
                      {count > 0 ? (
                        <UnreadCount count={count} />
                      ) : (
                        <>
                          <MessageCircle className="size-3.5" aria-hidden="true" />
                          <span className="hidden min-[380px]:inline">{t('home.message')}</span>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ----------------------------------------------- family help (jobs) */}
        <FamilyHelpPanel variant="card" />
      </div>
    </div>
  )
}
