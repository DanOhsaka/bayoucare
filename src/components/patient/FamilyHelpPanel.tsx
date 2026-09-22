import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  CheckSquare,
  Users,
} from 'lucide-react'

import { FAM_STATE, PATIENTS } from '@/data'
import { buildPlan, describeAppointment, fmtDay, nextAppointment } from '@/lib/calendar'
import { decodeEntities } from '@/lib/html'
import { RichText } from '@/components/shared/RichText'
import { isDone, useFamily } from '@/store/family'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'
import { useT } from '@/hooks/useT'
import { useInterp } from '@/hooks/useInterp'
import { cn } from '@/lib/utils'

const RIDE_PROVIDER = "Cora's Wheels"

/**
 * Concrete helper jobs for family — not a second account or global "mode".
 * Same patient record; pick up a task, check the next visit, or message the team.
 */
export function FamilyHelpPanel({ variant = 'card' }: { variant?: 'card' | 'page' }) {
  const t = useT()
  const ti = useInterp()
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const overrides = useFamily((s) => s.overrides[pid])
  const setDone = useFamily((s) => s.setDone)
  const alerts = useVitals((s) => s.alerts)

  const firstName = patient.name.split(' ')[0]
  const next = useMemo(() => nextAppointment(buildPlan(patient)), [patient])
  const appt = next ? describeAppointment(next, patient.calTypes) : null
  const latestAlert = alerts[alerts.length - 1] ?? null

  const openTasks = patient.family.tasks.filter((task, i) => {
    const state = FAM_STATE[task.st] ?? FAM_STATE.open
    return !isDone(overrides, i, Boolean(state.c))
  }).length

  const shell =
    variant === 'page'
      ? 'flex flex-col gap-4'
      : 'min-w-0 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]'

  return (
    <div className={shell}>
      <div className={cn(variant === 'page' && 'rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]')}>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Users className="size-4 text-brand-600" aria-hidden="true" />
            {ti('fam.helping', { name: firstName })}
          </h3>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            {openTasks > 0 ? t('fam.openCount', { n: openTasks }) : t('fam.allCaught')}
          </span>
        </div>

        <RichText html={patient.family.sub} className="block text-sm text-muted-foreground" />
        <p className="mt-2 text-xs text-muted-foreground">{t('fam.sameRecord')}</p>
      </div>

      {/* Next visit — the job caregivers most often need */}
      <div
        className={cn(
          'rounded-md border border-border p-3.5',
          variant === 'page' && 'bg-card shadow-[var(--shadow-sm)]',
          variant === 'card' && 'mt-4',
        )}
      >
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-4 flex-none text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-semibold text-card-foreground">{t('fam.nextVisit')}</b>
            {appt && next ? (
              <>
                <p className="mt-1 text-sm text-card-foreground">
                  {fmtDay(next.date, lang)} · {next.time} — {appt.label}
                </p>
                <p className="text-xs text-muted-foreground">{appt.where}</p>
                {next.ride ? (
                  <p className="mt-1.5 text-xs font-semibold text-success-fg">
                    {t('home.rideReady')} — {RIDE_PROVIDER}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">{t('fam.noRide')}</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{t('fam.noVisit')}</p>
            )}
            <Link
              to="/my-care/calendar"
              className="mt-2 inline-flex text-xs font-bold text-link hover:underline"
            >
              {t('fam.openCalendar')}
            </Link>
          </div>
        </div>
      </div>

      {/* Alert peek — only when the vitals demo (or real alert) has one */}
      {latestAlert && (
        <div
          className={cn(
            'rounded-md border border-warning/40 bg-warning-bg p-3.5 text-warning-fg',
            variant === 'card' && 'mt-3',
          )}
        >
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 size-4 flex-none" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <b className="block text-sm">{t('fam.alertHead')}</b>
              <p className="mt-1 text-sm">
                {latestAlert.when} · {latestAlert.reading}
              </p>
              <p className="mt-1 text-xs opacity-90">{latestAlert.msg}</p>
              <Link
                to="/my-care/vitals"
                className="mt-2 inline-flex text-xs font-bold underline-offset-2 hover:underline"
              >
                {t('fam.openVitals')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Shared task checklist */}
      <div className={cn(variant === 'card' ? 'mt-4' : 'rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]')}>
        {variant === 'page' && (
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <CheckSquare className="size-4 text-muted-foreground" aria-hidden="true" />
            {t('fam.tasksHead')}
          </h4>
        )}
        {variant === 'card' && (
          <h4 className="mb-2 text-sm font-semibold text-card-foreground">{t('fam.tasksHead')}</h4>
        )}
        <ul className="flex flex-col gap-2">
          {patient.family.tasks.map((task, i) => {
            const state = FAM_STATE[task.st] ?? FAM_STATE.open
            const done = isDone(overrides, i, Boolean(state.c))
            return (
              <li key={i}>
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
      </div>
    </div>
  )
}
