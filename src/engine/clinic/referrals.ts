/**
 * Rank 11 — Referral Express.
 *
 * Reproduced from the legacy single-file app. A mock SMART-on-FHIR R4 surface:
 * a rural PCP sends one referral and the labs, pathology and consent ride along
 * in a single transaction bundle, so both ends can see the status.
 *
 * Triage urgency is NOT a second model. `refTriage` reads the Rank 1 logistic
 * risk straight off the care-team store — `probabilityOf` for the number and
 * `riskOf` for its 50/25 severity cutoffs — so the percentage on a referral row
 * is provably the one on the Care Team roster, and moves with it the moment a
 * counterfactual action is applied there. Re-deriving either value here would
 * be the drift the coupling exists to prevent.
 *
 * Progress is the one thing the legacy mutated in place (`r.steps[next][2] = 1`).
 * These steps stay immutable; `refStep[id]` in the clinic store carries a count
 * of extra completions, which `refTimeline` folds back over the steps — the same
 * 'just now' stamping the legacy's click handler did, computed rather than
 * written.
 */
import { REFERRALS } from '@/data'
import { probabilityOf, riskOf, TEAM_PATIENTS, type TeamPatient } from '@/store/team'
import type { RiskLevel } from '@/engine/team/risk'

/** One referral, whose legacy shape is a loose record of positional tuples. */
export interface Referral {
  id: string
  /** The care-team patient this referral is for — the Rank 1 coupling. */
  pid: string
  /** The sending practice. */
  from: string
  fromCity: string
  parish: string
  /** The receiving site, as 'Ochsner Oncology — <city>'. */
  to: string
  coverage: string
  received: string
  miles: number
  transport: string
  broadband: string
  /** `[label, when, done]` — the legacy's step tuples, in timeline order. */
  steps: Array<[string, string, number]>
  /**
   * `[resourceType, id, instanceCount]` for the bundle. The count is the number
   * of entries FOLDED into that resource — it drives the bundle's truncation
   * comments, so 14 observations print as "+13 more".
   */
  res: Array<[string, string, number]>
}

/*
 * `REFERRALS` is typed `Array<Record<string, unknown>>` at the data boundary —
 * permissive because the extracted legacy shape is loose. The cast is local to
 * this module; nothing outside it sees the untyped record.
 */
const DATA = REFERRALS as unknown as Referral[]

/** Every referral, in `REFERRALS` order — the incoming-referrals list source. */
export const ALL_REFERRALS: Referral[] = DATA

/** No counterfactual actions applied — the baseline vector. */
const NO_ACTIONS: ReadonlySet<string> = new Set<string>()

/** `applied` straight off the care-team store, keyed by patient id. */
export type AppliedActions = Record<string, ReadonlySet<string>>

/** The referral with this id, or null — the legacy's `refOf`, which returned
 *  undefined and made every caller null-check before rendering. */
export function refOf(id: string): Referral | null {
  return DATA.find((r) => r.id === id) ?? null
}

/** The care-team patient a referral is for, or null when the id resolves to
 *  nobody. Replaces the legacy's hardcoded pid→name ternary in the list, which
 *  spelled out the same four names `TEAM` already carries. */
export function refPatient(r: Referral): TeamPatient | null {
  return TEAM_PATIENTS.find((p) => p.id === r.pid) ?? null
}

/** Steps already complete in the stored data, before any advancing. */
const baseDone = (r: Referral) => r.steps.filter((s) => s[2]).length

export interface RefProgress {
  done: number
  total: number
  /** Whole-percent complete, for the row bar. */
  pct: number
}

/**
 * How far along a referral is. `extra` is the count of steps the user has
 * advanced it by on top of the stored data.
 */
export function refProgress(r: Referral, extra = 0): RefProgress {
  const total = r.steps.length
  const done = Math.min(total, baseDone(r) + extra)
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

export interface RefTimelineStep {
  label: string
  when: string
  done: boolean
}

/**
 * The timeline rail, with the advanced steps folded in.
 *
 * A step the user advanced into that never carried a time gets 'just now' — the
 * legacy stamped that onto the step it completed. Steps that already carried a
 * time keep it, which is why the labs line on REF-2026-0418 still reads 10:02
 * once it completes.
 */
export function refTimeline(r: Referral, extra = 0): RefTimelineStep[] {
  const { done } = refProgress(r, extra)
  const stored = baseDone(r)
  return r.steps.map((s, i) => ({
    label: s[0],
    when: i >= stored && i < done && s[1] === '—' ? 'just now' : s[1],
    done: i < done,
  }))
}

/**
 * The label of the step "Advance one step" would complete next, or null when
 * the referral is already complete.
 *
 * The legacy took `steps.findIndex(s => !s[2])` — the first not-done step. The
 * stored steps are a contiguous done-prefix (and `refTimeline` only ever
 * extends that prefix), so the first not-done step is exactly `done`.
 */
export function refNextStep(r: Referral, extra = 0): string | null {
  const { done, total } = refProgress(r, extra)
  return done >= total ? null : (r.steps[done]?.[0] ?? null)
}

export interface RefTriage {
  level: RiskLevel
  /** The Rank 1 risk as a whole percent — the same number Care Team shows. */
  score: number
}

/**
 * Triage urgency, read off the Rank 1 logistic model.
 *
 * `probabilityOf` returns the raw probability and rounding it here reproduces
 * `stateOf().cur` exactly; the level comes from `riskOf` so its 50/25 cutoffs
 * are the model's own rather than a second copy of them. No referral patient
 * resolves to nobody in the shipped data, but the legacy's guarded fallback is
 * kept.
 */
export function refTriage(r: Referral, applied: AppliedActions): RefTriage {
  const p = refPatient(r)
  if (!p) return { level: 'none', score: 0 }
  const set = applied[r.pid] ?? NO_ACTIONS
  return {
    level: riskOf(set, p).level,
    score: Math.round(probabilityOf(set, p) * 100),
  }
}

/** The receiving city — the legacy split the destination on its em dash, and
 *  fell back to the full string when there was no dash to split on. */
export function refDestCity(r: Referral): string {
  const tail = r.to.split('—')[1]
  return tail ? tail.trim() : r.to
}

/**
 * The FHIR R4 transaction bundle as the legacy printed it — text, not a
 * serialized object, because the box is a truncated listing with `// …+N more`
 * comments that JSON.stringify cannot carry.
 *
 * The timestamp is the legacy's own constant, the same for every referral. That
 * is a quirk of the demo rather than a bug to fix: the box is a mock posted to
 * a mock receiving org.
 */
export function refBundle(r: Referral): string {
  const lines = [
    '{',
    '  "resourceType": "Bundle",',
    '  "type": "transaction",',
    `  "id": "${r.id.toLowerCase()}",`,
    '  "timestamp": "2026-08-12T09:14:00-05:00",',
    '  "entry": [',
  ]
  r.res.forEach((x, i) => {
    lines.push(
      `    { "resource": { "resourceType": "${x[0]}", "id": "${x[1]}" },` +
        ` "request": { "method": "POST", "url": "${x[0]}" } }` +
        (i < r.res.length - 1 ? ',' : ''),
    )
    if (x[2] > 1) lines.push(`    // …+${x[2] - 1} more ${x[0]} entries folded into this resource`)
  })
  lines.push('  ]', '}')
  return lines.join('\n')
}
