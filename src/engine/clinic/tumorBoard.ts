/**
 * Rank 10 — tumor-board prep.
 *
 * Reproduced from the legacy single-file app. `buildMDT` returns HTML because
 * the case summary is formatted prose with emphasised section heads, and it is
 * authored here from the app's own data — so it renders through RichText rather
 * than being escaped.
 *
 * The late-effects section is NOT re-derived here. It calls the real
 * survivorship engine (`ruleFind`), so the board sees exactly the rules the
 * survivorship care plan fires for the same patient. That coupling is the point
 * of the workflow: a second copy of the rules would drift from the one the SCP
 * letter and follow-up schedule are built from.
 */
import { SURVIVORS, TB_CASES, TEAM } from '@/data'
import { ruleFind, type Exposure, type FiredRule } from '@/engine/survivorship/lateRules'

/** One case in `TB_CASES`, whose legacy shape is a loose record of records. */
export interface TbCaseDef {
  /** 'surv' reads the case from a survivorship record; anything else from TEAM. */
  src: string
  id: string
  when: string
  quorum: string
  ajcc: { ed: string; t: string; n: string; m: string; stage: string }
  mol: Record<string, string>
  questions: string[]
  imaging: string[]
  path: string[]
}

/** A resolved case: the definition plus the record it was read from. */
export interface TbModel {
  c: TbCaseDef
  name: string
  /** A survivorship record's age is a number; the TEAM fallback prints '—'. */
  age: number | string
  parish: string
  dx: string
  treatments: Array<[string, string]>
  /** The rules the survivorship engine fired for this patient's exposures. */
  hits: FiredRule[]
}

/*
 * `TB_CASES` is typed `Record<string, Record<string, unknown>>` at the data
 * boundary — permissive because the extracted legacy shape is loose. The cast
 * is local to this module; nothing outside it sees the untyped record.
 */
const CASES = TB_CASES as unknown as Record<string, TbCaseDef>

/** Case ids in `TB_CASES` order — what the picker strip lists. */
export const TB_IDS = Object.keys(CASES)

/**
 * Resolve one case against the survivorship and care-team records.
 *
 * Returns null for an unknown id, and for a `surv` case with no matching
 * survivorship record — the legacy returned early on both, leaving the summary
 * panel as it was rather than rendering a half-built one.
 */
export function tbCase(id: string): TbModel | null {
  const c = CASES[id]
  if (!c) return null

  if (c.src === 'surv') {
    const s = SURVIVORS[c.id]
    if (!s) return null
    /*
     * The same cast the survivorship plan uses: `Exposure`'s two string-valued
     * fields (`axsurg`, `hormonal`) genuinely reach the rules as strings — the
     * rules branch on which kind, not merely whether — and the raw `Survivor`
     * type widens them to `number | boolean`.
     */
    const hits = ruleFind(s.e as unknown as Exposure)
    return {
      c,
      name: s.name,
      age: s.age,
      parish: s.parish,
      dx: s.dx,
      treatments: s.treatments,
      hits,
    }
  }

  const p = TEAM.find((x) => x.id === c.id)
  return {
    c,
    name: p ? p.name : c.id,
    age: '—',
    parish: '—',
    dx: p ? p.meta : '—',
    treatments: [],
    hits: [],
  }
}

/**
 * The MDT case summary, as the HTML the letter block renders.
 *
 * Section order, wording and the clinical content (staging, AJCC edition,
 * markers, the board's open questions) are the legacy's, verbatim. Only the
 * late-effects list is computed rather than retyped — see the module note.
 */
export function buildMDT(t: TbModel): string {
  const c = t.c
  const a = c.ajcc
  const parts: string[] = []

  parts.push(`<b>MULTIDISCIPLINARY TUMOR BOARD — CASE SUMMARY</b>`)
  parts.push(
    `Patient: ${t.name}${t.age !== '—' ? ', age ' + t.age : ''} · ${t.parish} · Board date: ${c.when}`,
  )
  parts.push(`Quorum: ${c.quorum}`)
  parts.push('')
  parts.push(`<b>Staging — ${a.ed}</b>`)
  parts.push(`${a.t} ${a.n} ${a.m} → <b>${a.stage}</b>`)
  parts.push('')
  parts.push(`<b>Diagnosis</b>`)
  parts.push(t.dx)
  parts.push('')
  parts.push(`<b>Molecular / markers</b>`)
  parts.push(
    Object.keys(c.mol)
      .map((k) => `${k.toUpperCase()}: ${c.mol[k]}`)
      .join(' · '),
  )

  if (t.treatments.length) {
    parts.push('')
    parts.push(`<b>Treatment history</b>`)
    t.treatments.forEach((x) => parts.push(`• ${x[0]} — ${x[1]}`))
  }

  parts.push('')
  parts.push(`<b>Open questions for the board</b>`)
  c.questions.forEach((q, i) => parts.push(`${i + 1}. ${q}`))

  if (t.hits.length) {
    parts.push('')
    parts.push(`<b>Late-effects surveillance carried in from the SCP engine</b>`)
    t.hits.forEach((h) => parts.push(`• ${h.cat} — ${h.short} (tier ${h.hit.t})`))
  }

  parts.push('')
  parts.push(`<b>Recommended imaging &amp; pathology</b>`)
  c.imaging.forEach((x) => parts.push(`• ${x}`))
  c.path.forEach((x) => parts.push(`• ${x}`))
  parts.push('')
  parts.push(
    `<b>Decision requested</b> — board consensus on the questions above, and who owns each follow-up.`,
  )
  parts.push('')
  parts.push(
    `BayouCare AI draft — assembled from the treatment record for clinician review before the board.`,
  )

  return parts.join('<br>')
}
