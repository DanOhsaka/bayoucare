/**
 * Rank 12 — PCP clinical decision-support feed.
 *
 * Reproduced from the legacy single-file app. The point of this module is the
 * coupling, not the card: every alert is computed by the SAME engine the
 * patient-facing calculator runs (`riskLung` / `riskBreast` / `riskColo` from
 * `@/engine/screening`) rather than by a provider-side copy of the criteria.
 * That is what lets "Probe in patient app" show identical numbers on both
 * sides. Re-deriving the thresholds here would let the two drift, and the drift
 * would stay invisible until a PCP acted on a stale recommendation.
 *
 * The legacy built this list once at module load (`let cdsState = cdsAlerts()`)
 * and then mutated a `status` field on each alert as the clinician accepted,
 * dismissed or sent it. The list is a pure function here; the mutable per-alert
 * status is session state and lives in the panel component.
 */
import { CDS_PANEL } from '@/data'
import {
  riskBreast,
  riskColo,
  riskLung,
  type BreastInput,
  type ColoInput,
  type LungInput,
  type Tier,
} from '@/engine/screening'

/**
 * One row of `CDS_PANEL`, whose legacy shape is a loose record. The data
 * boundary types the panel as `Array<Record<string, unknown>>`; the cast is
 * local to this module, so nothing outside it sees the untyped record.
 */
export interface CdsPatient {
  id: string
  name: string
  age: number
  mrn: string
  parish: string
  pcp: string
  team?: string
  /** Present on the smoking-history patients; drives the LDCT alert. */
  smoke?: { packs: number; status: string; quit: number }
  /** Present on the family-history breast patients. */
  breast?: { fdr: number; sig: string }
  /** Present on the colorectal patients. */
  colo?: { f: string }
}

const PANEL = CDS_PANEL as unknown as CdsPatient[]

/**
 * The three calculators an alert can point at — deliberately the same literal
 * union as the store's `CdsKind`, so `probe(alert.kind, alert.inputs)` is the
 * pair the clinic slice accepts.
 */
export type CdsKind = 'ldct' | 'breast' | 'colo'

/** What the clinician has done with an alert. `new` until they act on it. */
export type CdsStatus = 'new' | 'accepted' | 'dismissed'

interface CdsAlertBase {
  /** `${patient}-${kind}` — the legacy alert id, shown on the card as `Flag/<key>`. */
  key: string
  pt: CdsPatient
  label: string
  tier: Tier
  score: number
  unit: string
  action: string
  why: string
  source: string
}

/*
 * Discriminated on `kind` so `inputs` narrows to that calculator's own input
 * type. The kind and the inputs it probes can then never be assembled out of
 * step — which, in the legacy, was four untyped `set('lungAge', …)` calls that
 * only matched by hand.
 */
export type CdsAlert =
  | (CdsAlertBase & { kind: 'ldct'; inputs: LungInput })
  | (CdsAlertBase & { kind: 'breast'; inputs: BreastInput })
  | (CdsAlertBase & { kind: 'colo'; inputs: ColoInput })

/**
 * The alerts, in `CDS_PANEL` order.
 *
 * Lung and breast alerts are filtered by tier — a low-risk patient is not an
 * alert. Colorectal is NOT: the legacy pushed one for every patient with a
 * colorectal profile, because that card's value is the eligibility date and
 * the screening interval rather than a number, so a low tier still tells the
 * PCP something. Those render as MODERATE.
 */
export function cdsAlerts(): CdsAlert[] {
  const out: CdsAlert[] = []

  for (const pt of PANEL) {
    if (pt.smoke) {
      const smoke = pt.smoke
      const r = riskLung({ age: pt.age, packs: smoke.packs, status: smoke.status, quit: smoke.quit })
      if (r.tier !== 'low') {
        out.push({
          key: `${pt.id}-ldct`,
          pt,
          kind: 'ldct',
          label: 'Lung · LDCT',
          tier: r.tier,
          // The PLCO-style 6-year estimate, not the triage score the tier is banded on.
          score: r.plco,
          unit: '% 6-yr',
          action: r.ldct ? 'Order annual LDCT' : 'Discuss — near eligibility',
          why: `${smoke.packs} pack-years · ${smoke.status} smoker · age ${pt.age}`,
          source: 'USPSTF 2021 · NCCN Lung v2.2026',
          inputs: { age: pt.age, packs: smoke.packs, status: smoke.status, quit: smoke.quit },
        })
      }
    }

    if (pt.breast) {
      const breast = pt.breast
      const r = riskBreast({ age: pt.age, fdr: breast.fdr, sig: breast.sig })
      if (r.tier !== 'low') {
        out.push({
          key: `${pt.id}-breast`,
          pt,
          kind: 'breast',
          label: 'Breast',
          tier: r.tier,
          score: r.score,
          unit: '/100',
          // `start` and `mri` are the engine's own eligibility wording — the
          // screening age and the MRI rider are not re-stated here.
          action: `Mammogram from ${r.start}${r.mri}`,
          why:
            `${breast.fdr} first-degree relative${breast.fdr > 1 ? 's' : ''}` +
            (breast.sig === 'yes' ? ' · BRCA warning signs' : ''),
          source: 'ACS 2023 · family-history criteria',
          inputs: { age: pt.age, fdr: breast.fdr, sig: breast.sig },
        })
      }
    }

    if (pt.colo) {
      const colo = pt.colo
      const r = riskColo({ age: pt.age, f: colo.f })
      out.push({
        key: `${pt.id}-colo`,
        pt,
        kind: 'colo',
        label: 'Colorectal',
        // The calculator returns a boolean, not a band: high only for the
        // family-history profiles.
        tier: r.high ? 'high' : 'low',
        score: r.score,
        unit: '/100',
        action: r.due ? 'Order colonoscopy / FIT today' : `Start screening at ${r.startAge}`,
        why: r.high ? 'Family history — one relative diagnosed before 60' : 'Age-based screening',
        source: 'USPSTF 2021',
        inputs: { age: pt.age, f: colo.f },
      })
    }
  }

  return out
}
