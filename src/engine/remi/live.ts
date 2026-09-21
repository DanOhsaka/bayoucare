import { PATIENTS } from '@/data'

/** A row of the Morning Sweep — device vitals plus the patient's name. */
export interface SweepRow {
  name?: string
  temp?: string
  w?: string
  [k: string]: unknown
}

/**
 * Alerts raised by the 2am replay, which Remi reads when asked how the patient
 * has been doing.
 *
 * Mutable on purpose and living outside React: the writer is an interval and the
 * reader is a pure function (see the generated intent table, which expects the
 * bare identifier). It becomes a store when the vitals screen is ported.
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
