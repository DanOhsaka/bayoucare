import { createContext, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { BookingDialog } from '@/components/patient/BookingDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { CAL_ANCHOR, dayKey } from '@/lib/demoClock'
import { describeAppointment, fmtDay } from '@/lib/calendar'
import {
  dayState,
  indexApptsByDay,
  isActive,
  type Appointment,
  type ApptStatus,
} from '@/lib/appointments'
import { PATIENTS } from '@/data'
import { useAppointments, usePlan } from '@/store/appointments'
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

const STATUS_VARIANT: Record<ApptStatus, 'success' | 'warning' | 'neutral'> = {
  confirmed: 'success',
  requested: 'warning',
  cancelled: 'neutral',
}

const STATUS_KEY: Record<ApptStatus, string> = {
  confirmed: 'cal.statusConfirmed',
  requested: 'cal.statusRequested',
  cancelled: 'cal.statusCancelled',
}

/**
 * The day's appointments, handed to the calendar's day cells through context.
 *
 * Passing this down as a prop is not an option — `components` is consumed by
 * react-day-picker, not by us — and defining the day button inline would create
 * a new component identity on every render and remount all 42 cells.
 */
const DayDataContext = createContext<Record<string, Appointment[]>>({})

function DayWithDots({
  className,
  day,
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) {
  const byDay = useContext(DayDataContext)
  // Cancelled appointments keep their place in the agenda but do not put a dot
  // on the calendar — the day is not busy any more.
  const appts = (byDay[dayKey(day.date)] ?? []).filter(isActive)

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
            <span className="text-xs font-bold leading-none text-muted-foreground">
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
  const plan = usePlan(pid)
  const cancel = useAppointments((s) => s.cancel)
  const restore = useAppointments((s) => s.restore)

  const byDay = useMemo(() => indexApptsByDay(plan), [plan])
  const types = patient.calTypes

  const [month, setMonth] = useState<Date>(CAL_ANCHOR)
  const [selected, setSelected] = useState<Date | undefined>()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState<Appointment | null>(null)

  const dayList = selected ? (byDay[dayKey(selected)] ?? []) : null
  const activeCount = (dayList ?? []).filter(isActive).length

  // Every type the patient's record defines, so the legend always matches the
  // dots that can actually appear.
  const legend = Object.keys(types)

  function openBooking(appt: Appointment | null) {
    setEditing(appt)
    setBookingOpen(true)
  }

  /*
   * The split starts at `md`, not `lg`. The month grid is a fixed-width object —
   * it gains nothing from a 780px-wide cell except whitespace between the day
   * numbers — and leaving it stacked until 1024 meant 768–1023 rendered a phone's
   * calendar blown up to tablet width, with the day detail pushed below the fold.
   * 400px + the panel fits from 768px up.
   */
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,400px)_1fr] md:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('cal.head')}</CardTitle>
          <Badge variant="success">{t('cal.chip')}</Badge>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">{t('cal.sub')}</p>

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
              booked: plan.filter(isActive).map((a) => a.date),
              past: (d: Date) => d < CAL_ANCHOR,
              // The two states the port's audit found missing. Both are derived
              // from the same slot grid the Clinic Ops no-show board scores.
              full: (d: Date) => dayState(d, byDay[dayKey(d)] ?? []) === 'full',
              closed: (d: Date) => dayState(d, byDay[dayKey(d)] ?? []) === 'unavailable',
            }}
            modifiersClassNames={{
              booked: 'font-bold',
              past: 'opacity-55',
              full: 'text-warning-fg',
              closed: 'text-muted-foreground',
            }}
            components={{ DayButton: DayWithDots }}
            // Constrained to the column: the Shadcn calendar stretches to its
            // container, and a full-width card made every day cell enormous.
              className="mt-2 w-full [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(10)]"
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
            <span className="text-xs text-warning-fg">{t('cal.legendFull')}</span>
            <span className="text-xs text-muted-foreground">{t('cal.legendClosed')}</span>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------ agenda */}
      <Card>
        {/*
          Selecting a day rewrites the agenda below with no announcement, so a
          screen-reader user heard nothing at all after activating a day cell.
          The visible content is unchanged; this is the announcement.
        */}
        <p className="sr-only" aria-live="polite">
          {selected ? `${fmtDay(selected, lang)} — ${activeCount}` : ''}
        </p>

        <CardHeader>
          <CardTitle data-testid="cal-agenda-head">
            {/* "Pick a day" — it read `cal.book` for a while, which put the same
                words on the heading as on the button beside it and stopped
                telling the reader what to do. Caught in the visual pass. */}
            {selected ? fmtDay(selected, lang) : t('cal.pickDay')}
          </CardTitle>
          <CardAction>
            {selected && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setSelected(undefined)
                  setMonth(CAL_ANCHOR)
                }}
              >
                {t('cal.close')}
              </Button>
            )}
            <Button size="sm" onClick={() => openBooking(null)}>
              {t('cal.book')}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
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
                const cancelled = a.status === 'cancelled'
                return (
                  <li
                    key={a.id}
                    className={cn(
                      'flex flex-wrap items-center gap-3 rounded-md border border-border p-3',
                      cancelled && 'opacity-60',
                    )}
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
                    <Badge variant={STATUS_VARIANT[a.status]}>{t(STATUS_KEY[a.status])}</Badge>
                    {a.ride && (
                      <Badge variant="success">
                        <span aria-hidden="true">🚗</span> Ride
                      </Badge>
                    )}

                    <div className="flex flex-none gap-1">
                      {cancelled ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            restore(pid, a.id)
                            toast(t('cal.toastRestored'))
                          }}
                        >
                          {t('cal.undo')}
                        </Button>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openBooking(a)}>
                            {t('cal.resched')}
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setCancelling(a)}>
                            {t('cal.cancelAppt')}
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/*
        Keyed so the form re-seeds from `editing` on mount — one instance reused
        across appointments would show the previous one's values.
      */}
      <BookingDialog
        key={editing?.id ?? 'new'}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        editing={editing}
      />

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(o) => {
          if (!o) setCancelling(null)
        }}
        title={t('cal.cancelHead')}
        description={t('cal.cancelBody')}
        confirmLabel={t('cal.cancelConfirm')}
        cancelLabel={t('cal.keep')}
        tone="danger"
        onConfirm={() => {
          if (!cancelling) return
          cancel(pid, cancelling.id)
          toast(t('cal.toastCancelled'))
        }}
      />
    </div>
  )
}
