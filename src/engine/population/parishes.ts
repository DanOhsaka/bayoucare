/* ============================================================================
   The parish heat index, reproduced from the legacy app.

   Derived, not stored: every figure scales off the same `uns` (eligible and
   unscreened) so the outreach queue is largest exactly where the heat index
   says the burden is.
   ========================================================================= */
import { LA_MAP, PARISHES, PARISH_REAL, WAITLIST } from '@/data'

export interface ParishRow {
  n: string
  ab: string
  x: number
  y: number
  pop: number
  inc: number
  late: number | null
  cov: number
  uns: number
  need: number | null
  supp: boolean
  rank: number | null
}

const raw: Array<Omit<ParishRow, 'rank'>> = PARISHES.map((p) => {
  const d = PARISH_REAL[p.ab]
  const { pop, inc, cov } = d
  const late = d.late
  // uns = unscreened adults; 0.42 is the screening-eligible share of population.
  const uns = Math.round(pop * 0.42 * (1 - cov / 100))
  // Unmet-need index = unscreened rate × late-stage share. Normalises by
  // population, so rural parishes with poor coverage outrank big cities with
  // volume. Suppressed parishes carry no score rather than a fabricated one.
  const need = late == null ? null : Math.round(((100 - cov) * late) / 50 * 10) / 10
  return { ...p, pop, inc, late, cov, uns, need, supp: late == null }
})

export const PARISH_DATA: ParishRow[] = raw
  .slice()
  .sort((a, b) => (b.need ?? -1) - (a.need ?? -1))
  .map((p, i) => ({ ...p, rank: p.need == null ? null : i + 1 }))

export type MetricKey = 'need' | 'late' | 'inc' | 'cov'

interface Metric {
  label: string
  /** True when a HIGHER value is worse — it flips the colour ramp. */
  worse: boolean
  f: (p: ParishRow) => number | null
  fmt: (v: number) => string
}

export const METRICS: Record<MetricKey, Metric> = {
  need: { label: 'Unmet need index', worse: true, f: (p) => p.need, fmt: (v) => v.toFixed(1) },
  late: { label: 'Late-stage %', worse: true, f: (p) => p.late, fmt: (v) => `${v}%` },
  inc: { label: 'Incidence /100k', worse: true, f: (p) => p.inc, fmt: (v) => String(v) },
  cov: { label: 'Screening coverage', worse: false, f: (p) => p.cov, fmt: (v) => `${v}%` },
}

/**
 * Quintile bucket 1–5 for the colour ramp.
 *
 * 0 means suppressed — a neutral tile, never a fabricated colour. That case is
 * the reason this returns a number rather than a class name.
 */
export function bucketOf(p: ParishRow, metric: MetricKey): number {
  const m = METRICS[metric]
  const v = m.f(p)
  if (v == null) return 0
  const vals = PARISH_DATA.map((q) => m.f(q)).filter((x): x is number => x != null)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = Math.max(1, max - min)
  let b = Math.min(4, Math.floor(((v - min) / span) * 5))
  if (!m.worse) b = 4 - b
  return b + 1
}

export function centroidOf(path: string): [number, number] {
  // The legacy parses coordinates straight out of the SVG path string with a
  // regex rather than pulling in a path parser, which is a deliberate trade and
  // works. Kept as-is; precomputed once at module load instead of on hover.
  const nums = [...path.matchAll(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g)]
  if (!nums.length) return [0, 0]
  let sx = 0
  let sy = 0
  for (const m of nums) {
    sx += Number(m[1])
    sy += Number(m[2])
  }
  return [sx / nums.length, sy / nums.length]
}

export const MAP = LA_MAP

/** Centroid per parish, computed once. */
export const CENTROIDS: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(MAP.d).map(([name, d]) => [name, centroidOf(d)]),
)

/**
 * The 14-day follow-up figures for a parish.
 *
 * Seeded PRNG keyed on the parish name, so the numbers are stable across
 * reloads — the same determinism instinct as the demo clock and the slot
 * generator.
 */
export function parishResults(p: ParishRow) {
  const r = mulberry32(sh(`${p.n}|results`))
  const abnormal = Math.max(1, Math.round(p.uns * 0.0009 * (0.6 + r())))
  const overdue = Math.round(abnormal * (0.25 + r() * 0.3))
  const fitSent = Math.round(p.uns * 0.035 * (0.7 + r()))
  const fitBack = Math.round(fitSent * (0.38 + r() * 0.3))
  return {
    abnormal,
    overdue,
    fitSent,
    fitBack,
    fitRate: fitSent ? fitBack / fitSent : 0,
    lag: Math.round(9 + r() * 17),
  }
}

export function outreachAction(p: ParishRow): { label: string; tone: 'danger' | 'warning' | 'success' } {
  if (p.cov < 50) return { label: 'SMS nudge + mobile unit', tone: 'warning' }
  if (p.uns > 15000) return { label: 'Mobile unit + event', tone: 'danger' }
  if (p.late != null && p.late > 55) return { label: 'Outreach + CHW', tone: 'danger' }
  return { label: 'Event invite', tone: 'success' }
}

export function followAction(f: ReturnType<typeof parishResults>): {
  label: string
  tone: 'danger' | 'warning' | 'success'
} {
  if (f.lag > 14 && f.overdue > 0) return { label: 'CHW call + navigator escalate', tone: 'danger' }
  if (f.overdue > 0) return { label: 'Navigator call today', tone: 'warning' }
  if (f.fitRate < 0.4) return { label: 'FIT reminder SMS + prepaid mailer', tone: 'warning' }
  return { label: 'On track — routine reminder', tone: 'success' }
}

/** The 30-day action label shown in the parish side panel. */
export function sideAction(p: ParishRow): string {
  return outreachAction(p).label
}

/* ------------------------------------------------------------------ prng */

/** Seeded PRNG — every generated figure in the demo is reproducible. */
export function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a string hash — a stable seed for the generators. */
export function sh(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export { WAITLIST }
