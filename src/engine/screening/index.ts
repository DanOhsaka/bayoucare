/* ============================================================================
   Screening risk calculators.

   Reproduced VERBATIM from the legacy app. The arithmetic here is the product
   — the numbers a patient reads and acts on — so it is moved across unchanged,
   including the exact coefficient values and the rounding.

   The advisory strings are hardcoded English in the original rather than i18n
   keys, so they stay hardcoded here too. That is parity; adding them to the
   dictionary is a separate pass.
   ========================================================================= */

export type Tier = 'low' | 'mod' | 'high'

export function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z))
}

export interface LungInput {
  age: number
  packs: number
  status: 'current' | 'former' | 'never' | string
  quit: number
}

/**
 * PLCOm2012-style 6-year lung-cancer risk. A DEMO APPROXIMATION over the four
 * inputs the patient app collects — not the published Tammemägi model, which
 * also uses comorbidity, family-history, BMI, education and race terms.
 * Calibrated to land in a plausible range for the demo profiles.
 */
export function plco2012({ age, packs, status, quit }: LungInput) {
  if (!packs) return { pct: 0 }
  const z =
    -5.6 +
    0.075 * (age - 55) +
    0.055 * (packs - 20) +
    (status === 'current' ? 0.9 : 0) -
    0.045 * Math.min(quit || 0, 20)
  return { pct: +(sigmoid(z) * 100).toFixed(1) }
}

/** Band comes from the additive triage score; the percentage shown is the PLCO-style estimate. */
export function riskLung({ age, packs, status, quit }: LungInput) {
  const ldct = age >= 50 && age <= 80 && packs >= 20 && (status === 'current' || quit < 15)
  let score: number
  let tier: Tier
  let msg: string

  if (packs === 0) {
    score = Math.round(Math.min(25, Math.max(0, (age - 40) * 1.5)))
    tier = 'low'
    msg = 'No smoking history — LDCT is not recommended for never-smokers (USPSTF 2021). Stay alert for a new persistent cough, hoarseness, or chest symptoms, and keep your annual wellness visit.'
  } else {
    score = Math.round(
      Math.min(
        100,
        Math.max(
          0,
          (age - 40) * 1.5 +
            packs * 1.6 +
            (status === 'current' ? 15 : 0) -
            (status === 'former' ? (quit > 10 ? 10 : quit > 5 ? 5 : 0) : 0),
        ),
      ),
    )
    tier = score >= 55 ? 'high' : score >= 30 ? 'mod' : 'low'
    msg =
      tier === 'high'
        ? 'High risk — you meet USPSTF 2021 criteria for annual low-dose CT lung screening. BayouCare has scheduled your LDCT and attached the Quit-to-Screen bundle below.'
        : tier === 'mod'
          ? 'Moderate risk — discuss LDCT with your provider; screening eligibility starts at 50+ with 20+ pack-years.'
          : 'Lower risk — keep monitoring; rescreen in 3–5 years and protect your quit date.'
  }

  return { score, tier, msg, ldct, plco: plco2012({ age, packs, status, quit }).pct }
}

export interface BreastInput {
  age: number
  fdr: number
  sig: string
}

/**
 * Family-history risk factors only — not a validated model (Tyrer-Cuzick or
 * others). A genetic-counseling referral is how a formal estimate gets made.
 */
export function riskBreast({ age, fdr, sig }: BreastInput) {
  const score = Math.round(
    Math.min(100, 12 + Math.max(0, (age - 30) * 0.4) + fdr * 12 + (sig === 'yes' ? 25 : 0)),
  )
  const tier: Tier = score >= 55 ? 'high' : score >= 30 ? 'mod' : 'low'
  const start = tier === 'high' ? '35 — with genetic counseling' : '40 (ACS 2023)'
  const mri = tier === 'high' ? ' + annual breast MRI' : ''
  const msg =
    tier === 'high'
      ? 'High risk — a genetic counseling referral is flagged for your next visit, and screening starts at 35 with mammogram + annual MRI. Family members should each get their own risk score.'
      : tier === 'mod'
        ? 'Moderate risk — start annual mammograms at 40; consider genetic counseling if a first-degree relative was diagnosed young.'
        : 'Average risk — annual mammograms starting at 40 per ACS 2023. No genetic testing needed unless the family picture changes.'
  return { score, tier, start, mri, msg }
}

export interface ColoInput {
  age: number
  f: string
}

/** Triage score is for the CDS feed — this calculator shows eligibility, not a number. */
export function riskColo({ age, f }: ColoInput) {
  const high = f === 'oneyoung' || f === 'multiple'
  const startAge = high ? 40 : 45
  const interval = high
    ? 'colonoscopy every 5 years'
    : 'colonoscopy every 10 years or a stool FIT kit every year'
  const msg =
    age < startAge
      ? `Not due yet — USPSTF 2021 starts colorectal screening at ${startAge}${high ? ' because of your family history' : ''}. A reminder is set.`
      : `You're due now. ${high ? 'Your family history puts you at higher risk — ' : ''}BayouCare recommends ${interval}. Community screening days near you are listed on this screen.`
  return {
    high,
    startAge,
    interval,
    due: age >= startAge,
    msg,
    score: Math.round(Math.min(100, (high ? 45 : 20) + Math.max(0, age - startAge) * 1.5)),
  }
}

/* --------------------------------------------------------------- personas */

export const LUNG_PERSONAS = {
  tom: { age: 62, packs: 40, status: 'current', quit: 0 },
  rita: { age: 70, packs: 35, status: 'former', quit: 3 },
  neversmoker: { age: 58, packs: 0, status: 'never', quit: 0 },
} as const

export const BREAST_PERSONAS = {
  renee: { age: 34, fdr: 0, sig: 'none' },
  audrey: { age: 42, fdr: 1, sig: 'none' },
  marie: { age: 38, fdr: 1, sig: 'yes' },
} as const

export const COLO_PERSONAS = {
  marcus: { age: 31, f: 'none' },
  james: { age: 64, f: 'oneyoung' },
  carla: { age: 50, f: 'none' },
} as const
