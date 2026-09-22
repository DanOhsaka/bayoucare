import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { describeAppointment, fmtDay, offsetFromAnchor, rideFocusDay } from '@/lib/calendar'
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
  const [searchParams, setSearchParams] = useSearchParams()

  const byDay = useMemo(() => indexApptsByDay(plan), [plan])
  const types = patient.calTypes

  const [month, setMonth] = useState<Date>(CAL_ANCHOR)
  const [selected, setSelected] = useState<Date | undefined>()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [initialRide, setInitialRide] = useState(false)
  const [focusRideId, setFocusRideId] = useState<string | null>(null)

  // Access "Details" on a ride lands here with ?focus=ride — open Thursday (or
  // the next ride day) so the booked appointment is visible, or an empty day
  // ready to book with Request ride / pickup.
  useEffect(() => {
    if (searchParams.get('focus') !== 'ride') return
    const active = plan.filter(isActive)
    const day = rideFocusDay(active)
    setSelected(day)
    setMonth(day)
    const onDay = active.filter((a) => dayKey(a.date) === dayKey(day))
    const rideAppt = onDay.find((a) => a.ride) ?? onDay[0] ?? null
    setFocusRideId(rideAppt?.id ?? null)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, plan])

  const dayList = selected ? (byDay[dayKey(selected)] ?? []) : null
  const activeCount = (dayList ?? []).filter(isActive).length
  const selectedOff = selected ? offsetFromAnchor(selected) : undefined

  // Every type the patient's record defines, so the legend always matches the
  // dots that can actually appear.
  const legend = Object.keys(types)

  function openBooking(appt: Appointment | null, ride = false) {
    setEditing(appt)
    setInitialRide(ride || Boolean(appt?.ride))
    setBookingOpen(true)
  }

  /*
   * The split starts at `lg`, not `md`.
   *
   * It moved to `md` when the calendar was the full width of the page, and
   * 400px + the panel genuinely did fit from 768. It no longer does: the
   * patient sidebar became a column at `md` (see `MyCare`), which takes 240px
   * out of the content row and leaves ~470 at 768. In that space the two
   * columns fight, `minmax(0,400px)` loses the argument to the panel's
   * min-content, and the month grid ends up ~195px wide — under its own 308px
   * floor, so it starts scrolling on a screen with room to spare.
   *
   * Stacked, the calendar gets the whole ~470px column at tablet width, which
   * is WIDER than the 400px it had there before, and the day detail moves below
   * it. Nothing is lost: the panel was 320px beside a 400px calendar before,
   * and is 470 below a 470px one now.
   */
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
      {/* `min-w-0` matters: this Card is a grid item, so its automatic minimum
          size is its min-content size — which includes the month grid's 308px
          floor and the calendar's own padding. Without it the card refuses to
          shrink to the column, the page grows a scrollbar, and the scroll
          container added below never gets the chance to do its job. */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-lg">{t('cal.head')}</CardTitle>
          <Badge variant="success">{t('cal.chip')}</Badge>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">{t('cal.sub')}</p>

          <DayDataContext.Provider value={byDay}>
            {/*
              The scroll container that pays for the 44px day cells, bled past
              the card's padding — and, on the narrowest phones, past the page's
              `px-4` as well — so that it ends up paying nothing anywhere.

              Seven 44px columns need 308px of grid. Below `sm` the card's
              content box is `viewport - 34`: 16px of page padding, plus the
              card's 1px border and 24px padding, on each side. `-mx-6` cancels
              the card's own padding and nothing else, which leaves the scroll
              viewport at 286 at 320px and 341 at 375, or 262 and 317 of grid
              once the calendar's padding is taken. 375 clears the floor with
              9px to spare; 320 comes up 46px short.

              `max-[366px]:-mx-10` closes exactly that stretch. 366 is not a
              taste call, it is where `-mx-6` starts reaching 308 on its own —
              `viewport - 34 - 24 >= 308` — so the wider bleed is spent on the
              phones that need it and every width from 366 up (375, 414, the
              tablet band) is unchanged. The extra 16px per side is the page's
              `px-4`; `-mx-10` is `-mx-6` plus it, and the card's 1px border is
              what still keeps the wrapper 1px inside the viewport rather than
              past it.

              That is 318 of scroll viewport at 320px, and the calendar's own
              padding is the last piece: it drops to 4px per side below 366px
              (`calendar.tsx` owns that) leaving 310 of grid — 2px over the
              floor, cells at 44.29, and nothing to scroll. The day cells keep
              their 44px; it is the chrome around them that gave way.

              The cost is that on a 320px phone the month grid runs 5px from
              the screen edge while the card's own content sits at 41 — the
              calendar escapes the card's border. That overhang is the price of
              the Sunday column, and it buys back more than it spends: before
              this, 320px clipped the last column mid-cell with nothing on
              screen to say it was scrollable.

              From ~430px up the natural cell is already 46px, the floor stops
              binding and this wrapper has nothing left to scroll. It never
              scrolls at all from `md`, where the card is capped at 400px.
            */}
            <div className="-mx-6 overflow-x-auto max-[366px]:-mx-10 sm:mx-0">
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
            // The `--cell-size` overrides that used to sit here are gone —
            // they were pinning the grid to a 32/40px floor that is under the
            // touch minimum; `calendar.tsx` now owns that number.
              className="mt-2 w-full"
            />
            </div>
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
            <p className="text-sm text-muted-foreground">{t('cal.pickHint')}</p>
          )}

          {selected && dayList?.length === 0 && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">{t('cal.rideEmpty')}</p>
              <Button size="sm" variant="outline" onClick={() => openBooking(null, true)}>
                {t('cal.rideRequest')}
              </Button>
            </div>
          )}

          {selected && dayList && dayList.length > 0 && (
            <ul className="flex flex-col gap-2">
              {dayList.map((a) => {
                const d = describeAppointment(a, types)
                const cancelled = a.status === 'cancelled'
                const focused = focusRideId === a.id
                return (
                  <li
                    key={a.id}
                    className={cn(
                      'flex flex-wrap items-center gap-3 rounded-md border border-border p-3',
                      cancelled && 'opacity-60',
                      focused && 'border-brand-600 ring-2 ring-brand-600/30',
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

                    <div className="flex flex-none flex-wrap gap-1">
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
                          {!a.ride && (
                            <Button size="xs" variant="outline" onClick={() => openBooking(a, true)}>
                              {t('cal.rideRequest')}
                            </Button>
                          )}
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
        Keyed so the form re-seeds from `editing` / the selected calendar day on
        mount — one instance reused across appointments or empty days would show
        the previous values (and always defaulted new books to Aug 17 / off 0).
      */}
      <BookingDialog
        key={editing?.id ?? `new-${selectedOff ?? 'none'}-${initialRide ? 'ride' : 'noride'}`}
        open={bookingOpen}
        onOpenChange={(o) => {
          setBookingOpen(o)
          if (!o) setInitialRide(false)
        }}
        editing={editing}
        initialOff={selectedOff}
        initialRide={initialRide}
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
