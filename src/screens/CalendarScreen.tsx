import { createContext, useContext, useMemo, useState } from 'react'

import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { CAL_ANCHOR, dayKey } from '@/lib/demoClock'
import { buildPlan, describeAppointment, fmtDay, indexByDay } from '@/lib/calendar'
import { PATIENTS, type PlannedAppointment } from '@/data'
import { usePatient } from '@/store/patient'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/** Appointment type → categorical token. Replaces the legacy inline hex. */
const TYPE_DOT: Record<string, string> = {
  infusion: 'bg-cat-1',
  labs: 'bg-cat-2',
  imaging: 'bg-cat-3',
  followup: 'bg-cat-4',
  consult: 'bg-cat-5',
}

/**
 * The day's appointments, handed to the calendar's day cells through context.
 *
 * Passing this down as a prop is not an option — `components` is consumed by
 * react-day-picker, not by us — and defining the day button inline would create
 * a new component identity on every render and remount all 42 cells.
 */
const DayDataContext = createContext<Record<string, PlannedAppointment[]>>({})

function DayWithDots({
  className,
  day,
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) {
  const byDay = useContext(DayDataContext)
  const appts = byDay[dayKey(day.date)] ?? []

  return (
    <CalendarDayButton className={className} day={day} modifiers={modifiers} {...props}>
      {children}

      {appts.length > 0 && (
        <span className="mt-0.5 flex items-center justify-center gap-0.5" aria-hidden="true">
          {/*
            The legacy capped this at three and said nothing, so a day with four
            appointments looked identical to a day with three. Now the overflow
            is counted instead of dropped.
          */}
          {appts.slice(0, 3).map((a, i) => (
            <i
              key={i}
              className={cn('block size-1.5 rounded-full', TYPE_DOT[a.type] ?? 'bg-brand-500')}
            />
          ))}
          {appts.length > 3 && (
            <span className="text-[9px] font-bold leading-none text-muted-foreground">
              +{appts.length - 3}
            </span>
          )}
        </span>
      )}

      {appts.length > 0 && (
        <span className="sr-only">
          {appts.length} appointment{appts.length === 1 ? '' : 's'}
        </span>
      )}
    </CalendarDayButton>
  )
}

export function CalendarScreen() {
  const t = useT()
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]

  const plan = useMemo(() => buildPlan(patient), [patient])
  const byDay = useMemo(() => indexByDay(plan), [plan])
  const types = patient.calTypes

  const [month, setMonth] = useState<Date>(CAL_ANCHOR)
  const [selected, setSelected] = useState<Date | undefined>()

  const dayList = selected ? (byDay[dayKey(selected)] ?? []) : null

  // Every type the patient's record defines, so the legend always matches the
  // dots that can actually appear.
  const legend = Object.keys(types)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
      <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-card-foreground">{t('cal.head')}</h3>
          <span className="inline-flex items-center rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {t('cal.chip')}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{t('cal.sub')}</p>

        <DayDataContext.Provider value={byDay}>
          <Calendar
            mode="single"
            weekStartsOn={1}
            /*
              The frozen demo clock. react-day-picker defaults `today` to a live
              `new Date()`, which would put the today-ring on the real current
              date while every appointment is anchored to DEMO_TODAY — the
              calendar would highlight a day with nothing on it, five weeks away
              from the schedule it is showing.
            */
            today={CAL_ANCHOR}
            defaultMonth={CAL_ANCHOR}
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            modifiers={{
              // Days that have something on them, so they can be styled as a set.
              booked: plan.map((a) => a.date),
              past: (d: Date) => d < CAL_ANCHOR,
            }}
            modifiersClassNames={{
              booked: 'font-bold',
              past: 'opacity-55',
            }}
            components={{ DayButton: DayWithDots }}
            // Constrained to the column: the Shadcn calendar stretches to its
            // container, and a full-width card made every day cell enormous.
            className="mt-2 w-full [--cell-size:--spacing(10)]"
          />
        </DayDataContext.Provider>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3.5">
          {legend.map((key) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <i
                className={cn('block size-2 rounded-full', TYPE_DOT[key] ?? 'bg-brand-500')}
                aria-hidden="true"
              />
              {types[key].label}
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ agenda */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3
            data-testid="cal-agenda-head"
            className="text-base font-semibold text-card-foreground"
          >
            {selected ? fmtDay(selected, lang) : 'Pick a day'}
          </h3>
          {selected && (
            <button
              type="button"
              onClick={() => {
                setSelected(undefined)
                setMonth(CAL_ANCHOR)
              }}
              className="rounded px-2 py-1 text-xs font-bold text-brand-700 transition-colors hover:bg-accent"
            >
              Clear
            </button>
          )}
        </div>

        {/*
          These three strings are hardcoded English in the legacy app rather than
          i18n keys, so they stay hardcoded here — that is parity, not an
          oversight. Worth adding to the dictionary in a later pass, since every
          other patient-facing string is translated.
        */}
        {!selected && (
          <p className="text-sm text-muted-foreground">
            Choose any day on the calendar to see what is scheduled.
          </p>
        )}

        {selected && dayList?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing scheduled — a good day to rest.</p>
        )}

        {selected && dayList && dayList.length > 0 && (
          <ul className="flex flex-col gap-2">
            {dayList.map((a) => {
              const d = describeAppointment(a, types)
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-md border border-border p-3"
                >
                  <span
                    className="flex size-9 flex-none items-center justify-center rounded-md bg-accent text-base"
                    aria-hidden="true"
                  >
                    {d.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold text-card-foreground">{d.label}</b>
                    <span className="block text-xs text-muted-foreground">
                      {d.where} · {d.duration} min
                    </span>
                  </div>
                  <span className="flex-none text-sm font-bold text-card-foreground">{a.time}</span>
                  {a.ride && (
                    <span className="flex-none rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
                      🚗 Ride
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
