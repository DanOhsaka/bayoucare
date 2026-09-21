import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Field, SELECT_CLASS } from '@/components/shared/Field'
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
import { dateAtOffset, fmtShort } from '@/lib/calendar'
import { dayKey } from '@/lib/demoClock'
import { useAppointments, usePlan } from '@/store/appointments'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Set to edit an existing appointment; omitted to create a new one. */
  editing?: Appointment | null
}

/**
 * Book or reschedule an appointment.
 *
 * Mount this with `key={editing?.id ?? 'new'}` — the form seeds its state from
 * `editing` on mount, so reusing one instance for a different appointment would
 * show the previous one's values.
 *
 * The day list is the fourteen days from the frozen demo clock, and each is
 * disabled when the clinic is closed or the day is full. Which days those are
 * is derived from the slot grid the Clinic Ops no-show board also uses, not
 * invented here.
 */
export function BookingDialog({ open, onOpenChange, editing }: Props) {
  const t = useT()
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const plan = usePlan(pid)
  const book = useAppointments((s) => s.book)
  const reschedule = useAppointments((s) => s.reschedule)

  const types = patient.calTypes
  const typeKeys = Object.keys(types)

  const [off, setOff] = useState(editing?.off ?? 0)
  const [type, setType] = useState(editing?.type ?? typeKeys[0])
  const [time, setTime] = useState(editing?.time ?? '')
  const [ride, setRide] = useState(editing?.ride ?? false)
  const [error, setError] = useState<string | null>(null)

  /*
   * Fourteen days, each with its own state and slot grid. The appointment being
   * edited is excluded from its own day's occupancy, or rescheduling it to the
   * same time would be refused as a clash with itself.
   */
  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const date = dateAtOffset(i)
        const k = dayKey(date)
        const booked = plan.filter(
          (a) => a.id !== editing?.id && a.status !== 'cancelled' && dayKey(a.date) === k,
        )
        return { off: i, date, state: dayState(date, booked), slots: slotsFor(booked) }
      }),
    [plan, editing?.id],
  )

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t('cal.reschedHead') : t('cal.bookHead')}</DialogTitle>
          <DialogDescription>
            {t('cal.sub')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label={t('cal.head')} id="booking-day">
            <select
              id="booking-day"
              className={SELECT_CLASS}
              value={off}
              onChange={(e) => setOff(Number(e.target.value))}
            >
              {days.map((d) => (
                <option key={d.off} value={d.off} disabled={d.state !== 'open'}>
                  {fmtShort(d.date, lang)}
                  {d.state === 'full' ? ` — ${t('cal.fullDay')}` : ''}
                  {d.state === 'unavailable' ? ` — ${t('cal.closed')}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('cal.type')} id="booking-type">
            <select
              id="booking-type"
              className={SELECT_CLASS}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {typeKeys.map((k) => (
                <option key={k} value={k}>
                  {types[k].label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('cal.pickTime')} id="booking-time">
            <select
              id="booking-time"
              className={SELECT_CLASS}
              value={chosen}
              disabled={free.length === 0}
              onChange={(e) => setTime(e.target.value)}
            >
              {free.length === 0 ? (
                <option value="">{t('cal.noSlots')}</option>
              ) : (
                free.map((s) => (
                  <option key={s.time} value={s.time}>
                    {s.time}
                  </option>
                ))
              )}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              className="size-4 accent-[var(--brand-700)]"
              checked={ride}
              onChange={(e) => setRide(e.target.checked)}
            />
            {t('cal.ride')}
          </label>

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
