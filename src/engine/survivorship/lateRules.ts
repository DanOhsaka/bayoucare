/* ============================================================================
   CLINICAL SAFETY — READ BEFORE EDITING

   This engine is reproduced VERBATIM from the original single-file app by a
   generator, not by hand. Each rule's `matches()` is real branching logic over
   the patient's treatment exposures, and each `note` is clinical prose that
   reaches a survivorship care plan.

   It drives the late-effects radar, the follow-up schedule, and the PCP handoff
   letter. A silent change here is a change to clinical content.
   ========================================================================= */

/**
 * Treatment exposures. Cumulative anthracycline dose, which radiation fields,
 * and — for two of them — WHICH KIND, not merely whether: 'axsurg' is 'alnd' or
 * 'slnb', and 'hormonal' is 'aromatase' or similar, and the rules branch on that
 * distinction. Declaring those as booleans compiles and silently changes which
 * rules fire, so the types are read from the data, not from the field names.
 */
export interface Exposure {
  anthra: number
  chestRT: boolean
  breastRT: boolean
  axsurg: string | null
  platinum: boolean
  neckRT: boolean
  pelvicRT: boolean
  hormonal: string | null
  bleo: boolean
  adt: boolean
  ageAtRT: number
  [k: string]: number | boolean | string | null | undefined
}

/** One rule firing, with the surveillance it implies. */
export interface LateHit {
  t: number
  test: string
  freq: string
  start?: number
  note: string
}

export interface LateRule {
  cat: string
  short: string
  color: RuleTone
  matches: (e: Exposure) => LateHit | null
}

/** A rule that fired, with its category and display colour attached. */
export interface FiredRule {
  cat: string
  short: string
  color: RuleTone
  hit: LateHit
}

/**
 * The display tone for a fired rule — a token NAME, not a hex.
 *
 * The extracted data carried literal hexes (`#e05a3c`, `#e8960c`, `#2a8a62`),
 * which flowed straight into the radar's SVG `fill`/`stroke` and so could not
 * re-theme: the spokes kept their light-mode colours while every ring around
 * them inverted. The radar now paints `var(--danger)` and friends, which means
 * the tone vocabulary has to be a closed set rather than any string.
 */
export type RuleTone = 'danger' | 'warning' | 'success'

export const LATE_RULES: LateRule[] = [
  {cat:'Cardiac', short:'Cardiac', color:'danger', matches(e){
    let t = (e.anthra||0) >= 400 ? 3 : (e.anthra||0) >= 250 ? 2 : (e.anthra||0) >= 100 ? 1 : 0;
    if (e.chestRT) t = Math.max(t, 2);
    if (e.chestRT && (e.anthra||0) >= 150) t = 3;
    if (!t) return null;
    return {t, test:'Echocardiogram', freq:t === 3 ? 'annual' : 'every 2 years', start:0,
      note:t >= 2 ? 'Anthracycline ± chest radiation — cardiac risk persists for decades; watch for chest pain, palpitations, and breathlessness' : 'Anthracycline exposure — low-level surveillance'};
  }},
  {cat:'Secondary cancer', short:'2nd cancer', color:'danger', matches(e){
    if (e.chestRT && (e.ageAtRT === undefined || e.ageAtRT < 35)) return {t:3, test:'Breast MRI + mammogram (alternating every 6 months)', freq:'annual', start:0, note:'Chest radiation before age 35 — the highest secondary breast-cancer risk window'};
    if (e.chestRT) return {t:2, test:'Annual skin + lung check; low-dose CT if smoking history', freq:'annual', start:5, note:'Chest radiation — secondary cancer surveillance'};
    if (e.pelvicRT) return {t:2, test:'Colonoscopy', freq:'5 years', start:5, note:'Pelvic radiation — colorectal surveillance'};
    if (e.breastRT) return {t:1, test:'Clinical breast exam per screening schedule', freq:'annual', start:0, note:'Breast radiation — continue age-appropriate screening'};
    return null;
  }},
  {cat:'Thyroid', short:'Thyroid', color:'warning', matches(e){
    if (e.neckRT) return {t:2, test:'TSH + thyroid exam', freq:'annual', start:0, note:'Neck radiation — hypothyroidism is common, easy to treat, and often missed'};
    return null;
  }},
  {cat:'Bone health', short:'Bone', color:'warning', matches(e){
    let t = 0, test = '';
    if (e.adt){ t = 3; test = 'DXA bone density + calcium/vitamin D'; }
    else if (e.hormonal === 'aromatase'){ t = 2; test = 'DXA bone density'; }
    else if (e.pelvicRT){ t = 1; test = 'DXA bone density from age 65'; }
    if (!t) return null;
    return {t, test, freq:t === 3 ? 'annual' : 'every 2 years', start:t === 3 ? 0 : 1, note:t === 3 ? 'ADT markedly accelerates bone loss — DXA now' : t === 2 ? 'Aromatase inhibitors — bone density baseline within 12 months' : 'Pelvic radiation — low-level risk'};
  }},
  {cat:'Lymphedema', short:'Lymph', color:'warning', matches(e){
    if (e.axsurg === 'alnd') return {t:3, test:'Arm circumference measurements + PT education', freq:'every 6 months', start:0, note:'Axillary dissection — the highest lymphedema risk'};
    if (e.axsurg === 'slnb') return {t:1, test:'Arm check + education at annual visit', freq:'annual', start:0, note:'SLN biopsy — low risk, but monitor for heaviness or swelling'};
    return null;
  }},
  {cat:'Lung / breathing', short:'Lung', color:'warning', matches(e){
    if (e.bleo && e.chestRT) return {t:2, test:'Pulmonary function tests + smoking screen', freq:'every 3 years', start:5, note:'Bleomycin + radiation — additive pulmonary risk; avoid smoking entirely'};
    if (e.bleo) return {t:1, test:'PFT at 5 years post-treatment', freq:'once', start:5, note:'Bleomycin — long-term pulmonary fibrosis risk'};
    return null;
  }},
  {cat:'Kidney / hearing', short:'Kidney', color:'warning', matches(e){
    if (e.platinum) return {t:2, test:'Creatinine + audiogram', freq:'annual', start:0, note:'Cisplatin — nephrotoxicity and ototoxicity'};
    return null;
  }},
  {cat:'Cognitive', short:'Cognitive', color:'success', matches(e){
    if ((e.anthra||0) >= 250 || e.chestRT) return {t:1, test:'Screen at survivorship visit — fatigue, memory, mood', freq:'annual', start:0, note:'Chemo brain — rehabilitation and counseling referrals available'};
    return null;
  }},
  {cat:'Fertility', short:'Fertility', color:'success', matches(e){
    if (e.pelvicRT) return {t:2, test:'Hormonal review + oncofertility consult if family-building plans', freq:'once', start:0, note:'Pelvic radiation — gonadal dose; options exist at any age'};
    if (e.chestRT && (e.ageAtRT !== undefined && e.ageAtRT < 30)) return {t:1, test:'Fertility/endocrine review at survivorship visit', freq:'once', start:0, note:'Scatter radiation — typically low risk, worth documenting'};
    return null;
  }}
]

/**
 * Every rule that fires for this exposure set.
 *
 * The only change made to the extracted body is a type-level assertion on the
 * filter: `.filter(x => x.hit)` removes the nulls at runtime but TypeScript
 * cannot narrow through it, so callers would otherwise handle a null that
 * cannot occur. The predicate and the runtime behaviour are untouched.
 */
export function ruleFind(e: Exposure): FiredRule[]{ return LATE_RULES.map(r => ({cat:r.cat, short:r.short, color:r.color, hit:r.matches(e)})).filter(x => x.hit) as FiredRule[]; }
