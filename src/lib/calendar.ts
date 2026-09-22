import { CAL_ANCHOR, dayKey } from '@/lib/demoClock'
import type { CalendarType, Patient, PlannedAppointment } from '@/data'
import type { Lang } from '@/lib/i18n'

/**
 * The scheduled-appointment model.
 *
 * The legacy app stored appointments as day OFFSETS from the demo clock
 * (`{off: 3, type: 'labs', time: '08:40', ride: true}`) and resolved them to
 * real dates at load. That indirection is preserved exactly: the offsets are
 * what keep the demo byte-identical across runs, so they stay in the data and
 * the dates stay derived.
 */
export function buildPlan(patient: Patient): PlannedAppointment[] {
  return patient.calPlan.map((a, i) => ({
    ...a,
    id: `cal${i}`,
    date: dateAtOffset(a.off),
  }))
}

/**
 * A day offset from the frozen demo clock, resolved to a real date.
 *
 * Shared with the booking store, which creates appointments the bundled data
 * has never seen: both sides must resolve an offset identically or a booked
 * appointment would land on a different day than the one that was picked.
 */
export function dateAtOffset(off: number): Date {
  return new Date(CAL_ANCHOR.getFullYear(), CAL_ANCHOR.getMonth(), CAL_ANCHOR.getDate() + off)
}

/**
 * Inverse of `dateAtOffset`: how many calendar days `date` is past the frozen
 * demo clock. Used to preselect the booking dialog's day from the calendar.
 */
export function offsetFromAnchor(date: Date): number {
  const a = CAL_ANCHOR
  const from = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const to = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((to - from) / 86_400_000)
}

/**
 * How far ahead a patient can self-book, in days from the demo clock.
 *
 * The clinic Ops no-show board still scores a 14-day window; this horizon is
 * only for the patient booking dialog so a September calendar day is not
 * silently clamped back to mid-August.
 */
export const BOOKING_HORIZON_DAYS = 365

/** Whether an offset is inside the patient booking window. */
export function isBookableOff(off: number): boolean {
  return off >= 0 && off < BOOKING_HORIZON_DAYS
}

/** Group a plan by ISO day key, for calendar lookups. */
export function indexByDay(plan: PlannedAppointment[]): Record<string, PlannedAppointment[]> {
  const out: Record<string, PlannedAppointment[]> = {}
  for (const a of plan) {
    const k = dayKey(a.date)
    if (!out[k]) out[k] = []
    out[k].push(a)
  }
  return out
}

/**
 * Appointments from today onward, soonest first.
 *
 * The `>=` against the demo clock is deliberate — the legacy comparator is the
 * same, and on this frozen clock every appointment is in the future anyway. If
 * the clock is ever moved forward, past appointments drop out of "next up".
 */
export function upcoming(plan: PlannedAppointment[]): PlannedAppointment[] {
  return plan.filter((a) => a.date >= CAL_ANCHOR).sort((a, b) => +a.date - +b.date)
}

export function nextAppointment(plan: PlannedAppointment[]): PlannedAppointment | undefined {
  return upcoming(plan)[0]
}

/**
 * Day offset of the next Thursday on or after the demo clock.
 * Access "Ride to Thursday's appointment" deep-links here.
 */
export function nextThursdayOff(): number {
  const dow = CAL_ANCHOR.getDay() // 0 Sun … 4 Thu
  return (4 - dow + 7) % 7
}

/**
 * Day to open when Access "Details" focuses a ride: Thursday if that day has
 * anything booked, else the next upcoming ride appointment, else Thursday so
 * the patient can book and request pickup.
 */
export function rideFocusDay(plan: Array<{ date: Date; ride: boolean }>): Date {
  const thu = dateAtOffset(nextThursdayOff())
  const thuKey = dayKey(thu)
  if (plan.some((a) => dayKey(a.date) === thuKey)) return thu

  const withRide = plan
    .filter((a) => a.ride && a.date >= CAL_ANCHOR)
    .sort((a, b) => +a.date - +b.date)[0]
  return withRide?.date ?? thu
}

export function localeOf(lang: Lang): string {
  switch (lang) {
    case 'es':
      return 'es-ES'
    case 'ht':
      return 'ht-HT'
    case 'vi':
      return 'vi-VN'
    default:
      return 'en-US'
  }
}

/** "Thursday, Aug 20" */
export function fmtDay(d: Date, lang: Lang): string {
  return d.toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'short', day: 'numeric' })
}

/** "Aug 20", or "Jan 5, 2027" when the year differs from the demo clock. */
export function fmtShort(d: Date, lang: Lang): string {
  const sameYear = d.getFullYear() === CAL_ANCHOR.getFullYear()
  return d.toLocaleDateString(
    localeOf(lang),
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

export function monthLabel(d: Date, lang: Lang): string {
  return d.toLocaleDateString(localeOf(lang), { month: 'long', year: 'numeric' })
}

/** The one-line description of an appointment used across Home and the agenda. */
export function describeAppointment(a: PlannedAppointment, types: Record<string, CalendarType>) {
  const t = types[a.type]
  return {
    icon: t?.ico ?? '•',
    label: t?.label ?? a.type,
    where: t?.where ?? '',
    /** Site name only — the legacy truncates at the separator for the Home chip. */
    site: (t?.where ?? '').split(' · ')[0],
    duration: t?.dur ?? 0,
  }
}
