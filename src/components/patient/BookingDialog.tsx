import { useMemo, useState } from 'react'
import { Car } from 'lucide-react'
import { toast } from 'sonner'

import { Field } from '@/components/shared/Field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PATIENTS } from '@/data'
import { useT } from '@/hooks/useT'
import {
  dayState,
  slotsFor,
  type Appointment,
} from '@/lib/appointments'
import {
  BOOKING_HORIZON_DAYS,
  dateAtOffset,
  fmtShort,
  isBookableOff,
  monthLabel,
} from '@/lib/calendar'
import { dayKey } from '@/lib/demoClock'
import { useAppointments, usePlan } from '@/store/appointments'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Set to edit an existing appointment; omitted to create a new one. */
  editing?: Appointment | null
  /**
   * Day offset from the demo clock to preselect when creating. Ignored while
   * editing. Values outside the bookable year-long window fall back to today (0).
   */
  initialOff?: number
  /** Prefill "Request ride / pickup" (e.g. from Access Details empty-day flow). */
  initialRide?: boolean
}

type DayRow = {
  off: number
  date: Date
  state: ReturnType<typeof dayState>
  slots: ReturnType<typeof slotsFor>
}

const FIELD_TRIGGER =
  'h-11 px-3 py-0 text-sm shadow-[var(--shadow-sm)] lg:h-10'

/**
 * Book or reschedule an appointment.
 *
 * Mount this with `key={editing?.id ?? \`new-${initialOff}\`}` — the form seeds
 * its state from `editing` / `initialOff` on mount, so reusing one instance for
 * a different appointment or calendar day would show the previous values.
 *
 * The day list covers one year from the frozen demo clock. Closed Sundays and
 * full days stay disabled. Capacity is `DAY_CAPACITY` live appointments; times
 * come from the expanded day-long slot grid.
 */
export function BookingDialog({ open, onOpenChange, editing, initialOff, initialRide }: Props) {
  const t = useT()
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const plan = usePlan(pid)
  const book = useAppointments((s) => s.book)
  const reschedule = useAppointments((s) => s.reschedule)

  const types = patient.calTypes
  const typeKeys = Object.keys(types)

  const seedOff = (() => {
    if (editing) {
      return isBookableOff(editing.off) ? editing.off : 0
    }
    if (initialOff != null && isBookableOff(initialOff)) return initialOff
    return 0
  })()

  const [off, setOff] = useState(seedOff)
  const [type, setType] = useState(editing?.type ?? typeKeys[0])
  const [time, setTime] = useState(editing?.time ?? '')
  const [ride, setRide] = useState(editing?.ride ?? initialRide ?? false)
  const [error, setError] = useState<string | null>(null)
  /** Keep at most one booking select panel open — they stack in one dialog. */
  const [openField, setOpenField] = useState<'day' | 'type' | 'time' | null>(null)

  /*
   * One year of days, each with its own state and slot grid. The appointment
   * being edited is excluded from its own day's occupancy, or rescheduling it
   * to the same time would be refused as a clash with itself.
   */
  const days = useMemo(() => {
    const rows: DayRow[] = []
    for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
      const date = dateAtOffset(i)
      const k = dayKey(date)
      const booked = plan.filter(
        (a) => a.id !== editing?.id && a.status !== 'cancelled' && dayKey(a.date) === k,
      )
      rows.push({ off: i, date, state: dayState(date, booked), slots: slotsFor(booked) })
    }
    return rows
  }, [plan, editing?.id])

  const daysByMonth = useMemo(() => {
    const groups: { label: string; days: DayRow[] }[] = []
    for (const d of days) {
      const label = monthLabel(d.date, lang)
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.days.push(d)
      else groups.push({ label, days: [d] })
    }
    return groups
  }, [days, lang])

  const day = days.find((d) => d.off === off) ?? days[0]
  const free = day.slots.filter((s) => !s.taken)

  /*
   * Derived rather than synced by an effect: when the chosen day changes, the
   * previously picked time usually is not free on the new day, and silently
   * keeping it would submit a slot the user never saw.
   */
  const chosen = day.slots.some((s) => s.time === time && !s.taken)
    ? time
    : (free[0]?.time ?? '')

  function submit() {
    setError(null)
    if (!chosen) {
      setError(t('cal.noSlots'))
      return
    }
    const draft = { off, time: chosen, type, ride }
    const check = editing ? reschedule(pid, editing.id, draft) : book(pid, draft)
    if (!check.ok) {
      setError(check.reason === 'taken' ? t('cal.slotTaken') : t('cal.closed'))
      return
    }
    toast(editing ? t('cal.toastMoved') : t('cal.toastBooked'))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        overflow-visible so beUI Select panels are not clipped by the dialog's
        default overflow-y-auto (absolute menus paint outside the trigger).
      */}
      <DialogContent className="overflow-visible">
        <DialogHeader>
          <DialogTitle>{editing ? t('cal.reschedHead') : t('cal.bookHead')}</DialogTitle>
          <DialogDescription>{t('cal.bookSub')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* `cal.head` is the calendar card's heading ("My appointments") —
              reusing it here labelled the day picker "My appointments", which
              is what a screenshot caught. This is its own key. */}
          <Field label={t('cal.day')} id="booking-day">
            <Select
              id="booking-day"
              value={String(off)}
              open={openField === 'day'}
              onOpenChange={(next) => setOpenField(next ? 'day' : null)}
              onValueChange={(v) => setOff(Number(v))}
            >
              <SelectTrigger className={FIELD_TRIGGER} aria-label={t('cal.day')}>
                <SelectValue placeholder={t('cal.day')} />
              </SelectTrigger>
              <SelectContent>
                {daysByMonth.map((group) => (
                  <div key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.days.map((d) => {
                      const label =
                        fmtShort(d.date, lang) +
                        (d.state === 'full' ? ` — ${t('cal.fullDay')}` : '') +
                        (d.state === 'unavailable' ? ` — ${t('cal.closed')}` : '')
                      return (
                        <SelectItem
                          key={d.off}
                          value={String(d.off)}
                          disabled={d.state !== 'open'}
                          className="text-sm"
                        >
                          {label}
                        </SelectItem>
                      )
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('cal.type')} id="booking-type">
            <Select
              id="booking-type"
              value={type}
              open={openField === 'type'}
              onOpenChange={(next) => setOpenField(next ? 'type' : null)}
              onValueChange={setType}
            >
              <SelectTrigger className={FIELD_TRIGGER} aria-label={t('cal.type')}>
                <SelectValue placeholder={t('cal.type')} />
              </SelectTrigger>
              <SelectContent>
                {typeKeys.map((k) => (
                  <SelectItem key={k} value={k} className="text-sm">
                    {types[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('cal.pickTime')} id="booking-time">
            <Select
              id="booking-time"
              value={chosen || undefined}
              disabled={free.length === 0}
              open={openField === 'time'}
              onOpenChange={(next) => setOpenField(next ? 'time' : null)}
              onValueChange={setTime}
            >
              <SelectTrigger className={FIELD_TRIGGER} aria-label={t('cal.pickTime')}>
                <SelectValue placeholder={free.length === 0 ? t('cal.noSlots') : t('cal.pickTime')} />
              </SelectTrigger>
              <SelectContent>
                {free.map((s) => (
                  <SelectItem key={s.time} value={s.time} className="text-sm tabular-nums">
                    {s.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant={ride ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setRide((r) => !r)}
              aria-pressed={ride}
            >
              <Car className="size-4" aria-hidden="true" strokeWidth={1.75} />
              {ride ? t('cal.rideRequested') : t('cal.rideRequest')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('cal.ride')}</p>
          </div>

          {/* Reserved height and a live region, matching LoginGate's error
              handling — the only other surface in the app that reports a
              validation failure, and the reason there is a pattern to match. */}
          <p
            role="alert"
            aria-live="polite"
            className="min-h-[17px] text-sm font-semibold text-danger-fg"
          >
            {error}
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cal.close')}</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!chosen}>
            {editing ? t('cal.resched') : t('cal.book')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
