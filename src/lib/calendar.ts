import { CAL_ANCHOR, dayKey } from '@/lib/demoClock'
import type { CalendarType, Patient, PlannedAppointment } from '@/data'
import type { Lang } from '@/lib/i18n'

/**
 * The scheduled-appointment model.
 *
 * The legacy app stored appointments as day OFFSETS from the demo clock
 * (`{off: 2, type: 'labs', time: '08:40', ride: true}`) and resolved them to
 * real dates at load. That indirection is preserved exactly: the offsets are
 * what keep the demo byte-identical across runs, so they stay in the data and
 * the dates stay derived.
 */
export function buildPlan(patient: Patient): PlannedAppointment[] {
  return patient.calPlan.map((a, i) => ({
    ...a,
    id: `cal${i}`,
    date: new Date(
      CAL_ANCHOR.getFullYear(),
      CAL_ANCHOR.getMonth(),
      CAL_ANCHOR.getDate() + a.off,
    ),
  }))
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

export function localeOf(lang: Lang): string {
  return lang === 'es' ? 'es-ES' : 'en-US'
}

/** "Thursday, Aug 20" */
export function fmtDay(d: Date, lang: Lang): string {
  return d.toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'short', day: 'numeric' })
}

/** "Aug 20" */
export function fmtShort(d: Date, lang: Lang): string {
  return d.toLocaleDateString(localeOf(lang), { month: 'short', day: 'numeric' })
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
