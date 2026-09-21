import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, ClipboardList, Pill, Receipt, Stethoscope } from 'lucide-react'

import { FAM_STATE, PATIENTS, type CareTeamMember } from '@/data'
import { buildPlan, describeAppointment, fmtDay, nextAppointment } from '@/lib/calendar'
import { decodeEntities } from '@/lib/html'
import { useInterp } from '@/hooks/useInterp'
import { usePatient } from '@/store/patient'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { RichText } from '@/components/shared/RichText'

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
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]

  const next = useMemo(() => nextAppointment(buildPlan(patient)), [patient])
  const appt = next ? describeAppointment(next, patient.calTypes) : null

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------------ greeting */}
      <section className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-card-foreground">{ti('home.greet')}</h3>
          <span className="inline-flex items-center rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {patient.chip}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{t('home.sub')}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-base font-semibold text-card-foreground">{t('home.nextup')}</h4>
          <div className="flex flex-wrap gap-2">
            {/*
              The legacy button here carried `data-i18n="home.calBtn"`, a key that
              does not exist in the dictionary — so the language sweep replaced its
              label with the literal string "home.calBtn" and it shipped that way,
              visibly, on the app's main screen. It now uses the same key as the
              sidebar entry, which does exist.
            */}
            <Link
              to="/my-care/calendar"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-brand-600 px-3.5 text-sm font-bold text-link transition-colors hover:bg-accent"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {t('side.calendar')}
            </Link>
            <Link
              to="/my-care/checkins"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ClipboardList className="size-4" aria-hidden="true" />
              {t('home.checkinBtn')}
            </Link>
          </div>
        </div>

        {/*
          The next appointment and the ride are read from the record, not written
          into the markup. The legacy app had these as static text, which is how a
          lymphoma patient in Monroe was shown a blood draw at Rapides Regional —
          Darlene's appointment — as their own.
        */}
        <div className="mt-4 flex flex-wrap gap-2">
          {appt && next ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1 text-xs font-bold text-warning-fg">
                <span aria-hidden="true">{appt.icon}</span>
                {fmtDay(next.date, lang)} {next.time} — {appt.label} ({appt.site})
              </span>
              {/* Only claim a ride when the appointment actually has one. */}
              {next.ride && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success-fg">
                  <span aria-hidden="true">🚗</span>
                  {t('home.rideReady')} — {RIDE_PROVIDER}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Nothing scheduled right now.</span>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* --------------------------------------------------------- care team */}
        <section className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-card-foreground">{t('home.teamHead')}</h3>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {patient.careTeam.length} {t('home.members')}
            </span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {patient.careTeam.map((m, i) => {
              const Icon = TEAM_ICONS[i % TEAM_ICONS.length]
              return (
                <li key={m.name} className="flex items-center gap-3">
                  <div className="flex size-10 flex-none items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold text-card-foreground">{m.name}</b>
                    <p className="truncate text-xs text-muted-foreground">{teamSubtitle(m)}</p>
                  </div>
                  {/*
                    This was an inert <span> styled to look like a link — a control
                    that did nothing and could not be reached by keyboard. It is a
                    real button now. Messaging has no backend yet, so it says so
                    rather than pretending.
                  */}
                  <button
                    type="button"
                    className="flex-none rounded px-2 py-1 text-xs font-bold text-link transition-colors hover:bg-accent"
                    onClick={() => {
                      /* wired to the real messaging flow in a later checkpoint */
                    }}
                  >
                    {t('home.msg')}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ------------------------------------------------------ family circle */}
        <section className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-card-foreground">{t('home.famHead')}</h3>
            <span className="inline-flex items-center rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
              {t('home.famChip')}
            </span>
          </div>

          <RichText html={patient.family.sub} className="block text-sm text-muted-foreground" />

          <ul className="mt-3 flex flex-col gap-2">
            {patient.family.tasks.map((task, i) => {
              const state = FAM_STATE[task.st] ?? FAM_STATE.open
              const done = Boolean(state.c)
              return (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-md border border-border p-2.5"
                >
                  <span
                    className={
                      done
                        ? 'mt-0.5 flex size-4 flex-none items-center justify-center rounded-full bg-brand-500 text-on-dark'
                        : 'mt-0.5 size-4 flex-none rounded-full border border-border'
                    }
                    aria-hidden="true"
                  >
                    {done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold text-card-foreground">
                      {decodeEntities(task.t)}
                    </b>
                    <span className="text-xs text-muted-foreground">{decodeEntities(task.s)}</span>
                  </div>
                  <span className="flex-none text-xs font-semibold text-muted-foreground">
                    {t(state.d)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
