/* ============================================================================
   The care-team risk model, reproduced from the legacy app.

   A transparent logistic model — every number in the demo is computed, not
   mocked. The weights and the baseline are the product, so they move across
   unchanged.

   logit = B0 + 1.05·ANC + 0.15·missed + 0.6·admission + 0.006·miles
              + 0.6·SDOH + 0.12·cycle
   ========================================================================= */

export interface Factors {
  anc: number
  days: number
  adm: number
  miles: number
  sdoh: number
  cycle: number
}

export const W = {
  anc: 1.05,
  days: 0.15,
  adm: 0.6,
  miles: 0.006,
  sdoh: 0.6,
  cycle: 0.12,
  B0: -2.2,
} as const

export const logitOf = (f: Factors) =>
  W.B0 + W.anc * f.anc + W.days * f.days + W.adm * f.adm + W.miles * f.miles + W.sdoh * f.sdoh + W.cycle * f.cycle

export const probOf = (f: Factors) => 1 / (1 + Math.exp(-logitOf(f)))

export interface Action {
  label: string
  desc: string
  mod: (f: Factors) => void
}

export const ACTIONS: Record<string, Action> = {
  transport: {
    label: 'Arrange rides (NEMT)',
    desc: 'Bridge to Modivcare / volunteer drivers — shrinks miles to site',
    mod: (f) => {
      f.miles = Math.min(f.miles, 10)
    },
  },
  ancWatch: {
    label: 'Daily ANC watch at home',
    desc: 'Home CBC + nurse phone check — catches neutropenia early',
    mod: (f) => {
      f.anc = Math.min(f.anc, 0.1)
    },
  },
  sdoh: {
    label: 'SDOH referral — social worker',
    desc: 'PRAPARE screen + benefits enrollment (SNAP, LIHEAP, 2-1-1)',
    mod: (f) => {
      f.sdoh = 0
    },
  },
  rnCall: {
    label: 'Same-day RN call',
    desc: 'Re-engage within 24h by phone, SMS, or home visit',
    mod: (f) => {
      f.days = 0
    },
  },
  homeHealth: {
    label: 'Home health eval',
    desc: 'RN visit this week — stabilize before next cycle',
    mod: (f) => {
      f.adm = Math.max(0, f.adm - 1)
    },
  },
}

export type RiskLevel = 'critical' | 'watch' | 'none'

export interface Counterfactual {
  key: string
  label: string
  to: number
  drop: number
}

export interface RiskState {
  cur: number
  level: RiskLevel
  cfs: Counterfactual[]
}

/**
 * The feature vector after the applied actions.
 *
 * This is the legacy `refresh()`: start from the patient's baseline factors and
 * re-apply every action. Recomputed from scratch each time rather than mutated
 * in place, so an action can be un-applied without the history mattering.
 */
export function factorsFor(base: Factors, applied: ReadonlySet<string>): Factors {
  const f = { ...base }
  applied.forEach((k) => ACTIONS[k]?.mod(f))
  return f
}

/**
 * The current risk and every action worth taking.
 *
 * Counterfactuals are computed on top of the CURRENT vector, so applying one
 * action changes what the others are worth — the board genuinely re-runs rather
 * than replaying a cached ranking.
 */
export function stateOf(current: Factors): RiskState {
  const cur = probOf(current)
  const level: RiskLevel = cur >= 0.5 ? 'critical' : cur >= 0.25 ? 'watch' : 'none'

  const cfs = Object.keys(ACTIONS)
    .map((key) => {
      const ff = { ...current }
      ACTIONS[key].mod(ff)
      const to = probOf(ff)
      const drop = (cur - to) * 100
      return { key, label: ACTIONS[key].label, to: Math.round(to * 100), drop: +drop.toFixed(1) }
    })
    // Only actions that actually move the number are offered.
    .filter((c) => c.drop > 0.4)
    .sort((a, b) => b.drop - a.drop)

  return { cur: Math.round(cur * 100), level, cfs }
}

/** Each factor's contribution to the logit — what the detail panel bars show. */
export function contributions(base: Factors) {
  const LABELS: Record<string, string> = {
    anc: 'Low ANC trend',
    days: 'Missed check-ins',
    adm: 'Admissions (12 mo)',
    miles: 'Miles to site',
    sdoh: 'SDOH instability',
    cycle: 'Cycle number',
  }
  return (Object.keys(W) as Array<keyof typeof W>)
    .filter((k) => k !== 'B0')
    .map((k) => ({ k, label: LABELS[k], v: W[k] * base[k as keyof Factors] }))
    .filter((c) => Math.abs(c.v) > 0.005)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 5)
}
