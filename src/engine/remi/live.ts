import { PATIENTS } from '@/data'

/** A row of the Morning Sweep — device vitals plus the patient's name. */
export interface SweepRow {
  name?: string
  temp?: string
  w?: string
  [k: string]: unknown
}

/**
 * Alerts raised by the 2am replay, patient check-ins, and Remi crisis routing.
 * Remi reads this when asked how the patient has been doing; Care Team reads
 * the same list from the vitals store.
 */
export const remiLive = {
  vitalsAlerts: [] as Array<Record<string, unknown>>,
  /**
   * Check-in answers, keyed by question id. The check-in screen writes here and
   * the "how have I been feeling" intent reads the count, so an answer reflects
   * what was actually filled in rather than a canned score.
   */
  answers: {} as Record<string, number>,
}

/**
 * The first Morning Sweep row is always the logged-in patient, derived from
 * their record — exactly as `sweepRow()` did it. The rest of the table is the
 * fixed ward population.
 */
export function sweepRowFor(pid: keyof typeof PATIENTS): SweepRow {
  const p = PATIENTS[pid]
  return { name: p.name, ...p.vitals }
}
