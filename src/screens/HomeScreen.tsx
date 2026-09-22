import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardList, Pill, Receipt, Stethoscope } from 'lucide-react'

import { FAM_STATE, PATIENTS, type CareTeamMember } from '@/data'
import { buildPlan, describeAppointment, fmtDay, nextAppointment } from '@/lib/calendar'
import { decodeEntities } from '@/lib/html'
import { useInterp } from '@/hooks/useInterp'
import { isDone, useFamily } from '@/store/family'
import { usePatient } from '@/store/patient'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { RichText } from '@/components/shared/RichText'
import { cn } from '@/lib/utils'

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

  // The family circle. `caregiver` comes from the persisted mode the sidebar
  // toggles, so the framing survives navigating away and back.
  const caregiver = useUi((s) => s.caregiver)
  const overrides = useFamily((s) => s.overrides[pid])
  const setDone = useFamily((s) => s.setDone)
  const firstName = patient.name.split(' ')[0]

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
            {/* `h-11 lg:h-9`: 36px is under the touch floor, and these are the
                two primary actions on the home screen. */}
            <Link
              to="/my-care/calendar"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-brand-600 px-3.5 text-sm font-bold text-link transition-colors hover:bg-accent lg:h-9"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {t('side.calendar')}
            </Link>
            <Link
              to="/my-care/checkins"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 lg:h-9"
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
                    {/* `lg:truncate` rather than a bare `truncate`: at 320px this
                        line measures ~57px wider than its column and was being
                        clipped at 77%, which cut "Ochsner Baton Rouge" down to
                        "Ochsner Baton R". Where the practice is matters on a
                        navigation app, and it appears nowhere else on the card,
                        so it wraps to a second line on a phone instead. */}
                    <p className="text-xs text-muted-foreground lg:truncate">{teamSubtitle(m)}</p>
                  </div>
                  {/*
                    A "Message" button lived here. It had been promoted from an
                    inert <span> to a real <button> for keyboard reachability,
                    with a comment saying it would be "wired to the real
                    messaging flow in a later checkpoint" — but there is no
                    messaging backend, and no later checkpoint left to build one
                    in. A control that announces itself, takes focus, and then
                    does nothing when pressed is worse than no control: it
                    reads as broken rather than as absent. Removed.

                    The app's messaging-shaped surface is Remi, which is
                    reachable from the launcher on every screen.
                  */}
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

          {/* Where a family member comes in. Stated plainly rather than left
              for the reader to infer — the reviewer's note about the access
              flow was that it was not clear who this surface is for. */}
          <p
            className={cn(
              'mt-2.5 text-xs',
              caregiver ? 'font-semibold text-warning-fg' : 'text-muted-foreground',
            )}
          >
            {caregiver ? t('home.famCgOn', { name: firstName }) : t('home.famAccess')}
          </p>

          <ul className="mt-3 flex flex-col gap-2">
            {patient.family.tasks.map((task, i) => {
              const state = FAM_STATE[task.st] ?? FAM_STATE.open
              const done = isDone(overrides, i, Boolean(state.c))
              return (
                <li key={i}>
                  {/*
                    A real checkbox. This was a decorative span painted from the
                    bundled status, so the one surface in the app that models a
                    family sharing the work could be read and never touched.
                    The override lives in the family store, not the record.
                  */}
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-2.5 transition-colors hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={(e) => setDone(pid, i, e.target.checked)}
                      className="mt-0.5 size-4 flex-none accent-brand-500"
                    />
                    <span className="min-w-0 flex-1">
                      <b
                        className={cn(
                          'block text-sm font-semibold',
                          done ? 'text-muted-foreground line-through' : 'text-card-foreground',
                        )}
                      >
                        {decodeEntities(task.t)}
                      </b>
                      <span className="text-xs text-muted-foreground">{decodeEntities(task.s)}</span>
                    </span>
                    <span
                      className={cn(
                        'flex-none text-xs font-semibold',
                        done ? 'text-success-fg' : 'text-muted-foreground',
                      )}
                    >
                      {done ? t('home.done') : t(state.d)}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
