import { SLOT_TIMES, type PlannedAppointment } from '@/data'
import { dayKey } from '@/lib/demoClock'

/**
 * The appointment status model — net-new with the booking flow.
 *
 * The bundled `calPlan` has no status: every appointment in a patient's record
 * was scheduled by the clinic, so they all arrive `confirmed`. Only the booking
 * flow introduces the other two states, and it is what makes the calendar's
 * "full" and "unavailable" day states meaningful rather than decorative.
 */
export type ApptStatus = 'confirmed' | 'requested' | 'cancelled'

export interface Appointment extends PlannedAppointment {
  status: ApptStatus
  /** Set when the patient booked it in this session, for the "new" affordance. */
  selfBooked?: boolean
}

/**
 * The clinic's opening rule, and the only thing that makes a day unavailable.
 * Sunday is closed; everything else is open unless every slot time is taken.
 */
export function isClinicClosed(d: Date): boolean {
  return d.getDay() === 0
}

export type DayState = 'open' | 'full' | 'unavailable'

/**
 * How many live appointments fill a clinic day for the patient calendar.
 *
 * Bookable times (`SLOT_TIMES`) span the whole day in 20-minute steps; capacity
 * stays near the old nine-slot board so "fully booked" still means something
 * and Clinic Ops no-show math is not tied to every selectable minute.
 */
export const DAY_CAPACITY = 9

/**
 * The state of one day, given the appointments that already sit on it.
 *
 * Cancelled appointments do not occupy a slot. "Full" uses `DAY_CAPACITY`, not
 * `SLOT_TIMES.length`, so expanding the picker does not make a day impossible
 * to mark full.
 */
export function dayState(d: Date, dayAppts: Appointment[]): DayState {
  if (isClinicClosed(d)) return 'unavailable'
  const live = dayAppts.filter((a) => a.status !== 'cancelled')
  return live.length >= DAY_CAPACITY ? 'full' : 'open'
}

export interface SlotOption {
  time: string
  taken: boolean
}

/** The slot grid for one day, with whatever is already booked marked taken. */
export function slotsFor(dayAppts: Appointment[]): SlotOption[] {
  const taken = new Set(
    dayAppts.filter((a) => a.status !== 'cancelled').map((a) => a.time),
  )
  return SLOT_TIMES.map((time) => ({ time, taken: taken.has(time) }))
}

/** The first slot that is still free, or null when the day is full. */
export function firstFreeSlot(dayAppts: Appointment[]): string | null {
  return slotsFor(dayAppts).find((s) => !s.taken)?.time ?? null
}

/**
 * Whether a booking attempt is allowed, and why not when it is not.
 *
 * Returns a reason rather than a bare boolean so the dialog can say what is
 * wrong instead of silently disabling a button — the app has no other form
 * that validates, and a disabled control with no explanation is the failure
 * mode worth avoiding.
 */
export type BookingCheck = { ok: true } | { ok: false; reason: 'closed' | 'taken' }

export function canBook(time: string, dayAppts: Appointment[]): BookingCheck {
  if (slotsFor(dayAppts).find((s) => s.time === time)?.taken) {
    return { ok: false, reason: 'taken' }
  }
  return { ok: true }
}

let seq = 0

/**
 * Ids for appointments booked in this session.
 *
 * Deterministic on purpose: the app is built around a frozen demo clock and a
 * seeded PRNG so every run is byte-identical, and `Math.random()` here would
 * quietly break that. The counter only has to be unique within a session
 * because nothing persists.
 */
export function newApptId(): string {
  seq += 1
  return `cal-new-${seq}`
}

/** Bundled appointments arrive confirmed; this is where that is asserted. */
export function withStatus(plan: PlannedAppointment[]): Appointment[] {
  return plan.map((a) => ({ ...a, status: 'confirmed' as const }))
}

/** Group appointments by ISO day key. The status-aware twin of `indexByDay`. */
export function indexApptsByDay(
  plan: Appointment[],
): Record<string, Appointment[]> {
  const out: Record<string, Appointment[]> = {}
  for (const a of plan) {
    const k = dayKey(a.date)
    if (!out[k]) out[k] = []
    out[k].push(a)
  }
  return out
}

/** The statuses that still occupy the schedule. */
export function isActive(a: Appointment): boolean {
  return a.status !== 'cancelled'
}
