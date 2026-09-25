/**
 * The app clock — local calendar "today".
 *
 * Appointment plans use day offsets from this clock, so the schedule, the
 * calendar today-marker, and "next appointment" stay aligned with the real
 * current date.
 *
 * Prefer `today()` over a frozen Date so midnight rollovers stay correct.
 * Other modules should not call bare `new Date()` for "today" — go through here.
 */
export function today(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

/**
 * Live calendar anchor — same as `today()`.
 * Kept as a function (not a frozen const) so the month view tracks the wall clock.
 */
export function calAnchor(): Date {
  return today()
}

/** @deprecated Prefer `today()` / `calAnchor()`. */
export const DEMO_TODAY = today()

/** @deprecated Prefer `calAnchor()`. */
export const CAL_ANCHOR = DEMO_TODAY

/** Add `n` days to today's local midnight. */
export function dayOffset(n: number): Date {
  const a = today()
  return new Date(a.getFullYear(), a.getMonth(), a.getDate() + n)
}

/**
 * Stable key for a day. Emits ISO (`2026-07-19`).
 */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
