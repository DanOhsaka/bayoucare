/**
 * The demo clock.
 *
 * BayouCare deliberately runs on a FROZEN date rather than the wall clock. The
 * appointment plans, the seeded slot generator and the parish results are all
 * anchored to it, so every reload and every live demo renders byte-identically.
 * A live `new Date()` would make each run different, which is exactly what the
 * original author avoided.
 *
 * This is the single place that date is defined. Nothing else in `src/` may
 * call `new Date()` with no arguments — `npm run check:clock` enforces that.
 *
 * To move the demo forward, change DEMO_TODAY and nothing else. Note the
 * appointments then shift with it: Darlene's plan runs from +2 to +39 days, so
 * the current anchor places her last appointment on 2026-09-25.
 */
export const DEMO_TODAY = new Date(2026, 7, 17)

/** The calendar's anchor. Same instant as DEMO_TODAY, named for its role. */
export const CAL_ANCHOR = DEMO_TODAY

/** Today, as a fresh Date at local midnight — for comparisons, not for storage. */
export function today(): Date {
  return new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate())
}

/** Add `n` days to the demo clock. */
export function dayOffset(n: number): Date {
  return new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate() + n)
}

/**
 * Stable key for a day. The legacy app used an unpadded, zero-based-month key
 * (`2026-7-19`) which is internally consistent but is a trap for anything that
 * expects a real date string. This emits ISO (`2026-07-19`).
 */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
