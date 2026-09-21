/**
 * Rank 9 — prior-auth autopilot.
 *
 * Reproduced from the legacy single-file app. `buildAuthLetter` returns HTML
 * because the payer letter is formatted prose with emphasised headings, and it
 * is authored here from the app's own data — so it renders through RichText
 * rather than being escaped, the same path the survivorship letter and the
 * tumor-board summary take.
 *
 * `applied` is a PARAMETER rather than a store import, which keeps this module
 * pure: the section hands it `useTeam().applied` straight off the React store.
 * That is the point of the workflow — the transport criterion reads the
 * Counterfactual actions applied on the Care Team tab, so applying "Arrange
 * rides (NEMT)" there visibly strengthens this packet. Copying `applied` into
 * component state, or caching a checklist, would silently sever it.
 */
import { AUTH_CASES, TEAM } from '@/data'
import { mulberry32, sh } from '@/engine/population/parishes'

/** The guideline the packet cites — NCCN, in the demo data. */
export interface AuthGuide {
  body: string
  ver: string
  cite: string
}

/**
 * One case in `AUTH_CASES`.
 *
 * The legacy shape is a loose record of records; the cast below is local to
 * this module, so nothing outside it sees the untyped record.
 */
export interface AuthCaseDef {
  payer: string
  plan: string
  mrn: string
  dx: string
  stage: string
  histo: string
  regimen: string
  jcodes: string[]
  line: string
  priorLines: number
  status: string
  guide: AuthGuide
  /** `[document, date]` pairs, as the legacy authored them. */
  docs: Array<[string, string]>
}

const CASES = AUTH_CASES as unknown as Record<string, AuthCaseDef>

/** Case ids in `AUTH_CASES` order — what the picker strip lists. */
export const AUTH_IDS = Object.keys(CASES)

/** A case resolved against the care-team record. */
export interface AuthModel {
  c: AuthCaseDef
  /** The patient's name from TEAM; the id itself when there is no record. */
  name: string
  meta: string
}

/** Resolve one case. Returns null for an unknown id, as the legacy did. */
export function authCase(id: string): AuthModel | null {
  const c = CASES[id]
  if (!c) return null
  const p = TEAM.find((x) => x.id === id)
  return { c, name: p ? p.name : id, meta: p ? p.meta : '' }
}

/** One medical-necessity criterion, checked or pending. */
export interface AuthCriterion {
  t: string
  ok: boolean
  note?: string
}

/**
 * The medical-necessity checklist for one case.
 *
 * `applied` is the Care Team worklist's `applied` record — the same object
 * `factorsFor()` consumes — so the transport item is the cross-module coupling
 * the legacy demoed.
 *
 * The `?? new Set()` stays: AUTH_CASES ids need not all be TEAM ids, and an
 * unknown id must render its criteria as pending rather than throw.
 */
export function authChecklist(
  id: string,
  applied: Record<string, ReadonlySet<string>>,
): AuthCriterion[] {
  const c = CASES[id]
  if (!c) return []

  const acts = applied[id] ?? new Set<string>()
  const transport = acts.has('transport') || acts.has('sdoh')

  return [
    { t: 'Histologically confirmed diagnosis on file — ' + c.histo, ok: true },
    { t: 'Stage documented and staged per NCCN — ' + c.stage, ok: true },
    {
      t: 'Regimen is guideline-preferred for this stage — ' + c.guide.body + ' ' + c.guide.ver,
      ok: true,
    },
    { t: 'Line of therapy documented — ' + c.line + ' (prior lines: ' + c.priorLines + ')', ok: true },
    { t: 'Baseline labs and organ function within protocol limits', ok: true },
    {
      t: 'Supportive-care + transport barriers addressed',
      ok: transport,
      note: transport
        ? 'Rank 1 counterfactual applied on the Care Team tab — packet is stronger.'
        : 'Not addressed — apply a transport/SDOH action on the Care Team tab',
    },
    { t: 'Informed consent discussion scheduled', ok: true },
  ]
}

/** One step of the authorization tracker. */
export interface RailStep {
  label: string
  when: string
  done: boolean
}

export interface AuthRailModel {
  /** The authorization number every surface quotes. Stable per case id. */
  ref: string
  steps: RailStep[]
}

/**
 * The authorization tracker.
 *
 * The legacy read two module-scope fields here — `authApplied[id].submitted`
 * and the length of its `rail` array, which the submit animation pushed to on
 * each beat. In React `submitted` lives in the clinic store and the animation
 * is the section's own transient state, so both arrive as arguments; calling
 * `authRail(id)` alone yields the un-submitted rail, which is what the letter
 * is built from.
 */
export function authRail(id: string, submitted = false, progress = 0): AuthRailModel {
  const c = CASES[id]
  const ref = 'PA-2026-' + (1000 + Math.floor(mulberry32(sh(id))() * 8999))
  if (!c) return { ref, steps: [] }

  const steps: RailStep[] = [
    { label: 'Packet generated', when: 'draft', done: true },
    { label: 'Submitted to ' + c.payer, when: 'submitted', done: submitted },
    { label: 'Under medical-necessity review', when: c.payer, done: progress >= 1 },
    { label: 'Approved — authorization issued', when: ref, done: progress >= 2 },
    { label: 'Infusion scheduled against auth', when: 'chair booked', done: progress >= 3 },
  ]
  return { ref, steps }
}

/**
 * The payer letter, as the HTML the letter block renders.
 *
 * Section order, wording and the clinical content — the diagnosis and stage,
 * histology, regimen, J-codes, the NCCN citation, the criteria list and the
 * attached documents — are the legacy's, verbatim.
 */
export function buildAuthLetter(
  id: string,
  applied: Record<string, ReadonlySet<string>>,
): string {
  const a = authCase(id)
  if (!a) return ''
  const { c, name } = a

  const list = authChecklist(id, applied)
  const rail = authRail(id)

  const L: string[] = []
  L.push(`<b>PRIOR AUTHORIZATION REQUEST — MEDICAL NECESSITY</b>`)
  L.push(`Authorization: ${rail.ref} · Payer: ${c.payer} (${c.plan})`)
  L.push(`Member MRN: ${c.mrn} · Requesting: Ochsner Oncology`)
  L.push('')
  L.push(`<b>Diagnosis</b> — ${c.dx}, ${c.stage}`)
  L.push(`<b>Histology / markers</b> — ${c.histo}`)
  L.push(`<b>Requested regimen</b> — ${c.regimen} (${c.line})`)
  L.push(`<b>HCPCS / J-codes</b> — ${c.jcodes.join(' · ')}`)
  L.push('')
  L.push(`<b>Clinical justification</b>`)
  /*
   * The legacy branched on `rail.steps[0][1] === 'draft'`, the "when" of the
   * first step — which is the literal `'draft'` by construction, so it always
   * resolved to the first branch. Kept as written rather than flattened, since
   * both branches are authored clinical prose.
   */
  L.push(
    `${name} presents with ${c.dx}, staged ${c.stage}. ` +
      `The requested regimen — ${c.regimen} — is the guideline-preferred choice for this presentation (${c.line}). ` +
      `${c.guide.body} ${c.guide.ver} states: ${c.guide.cite} ` +
      `Delay to treatment start is the primary modifiable driver of worse outcomes in this population, ` +
      `and this request is submitted ${rail.steps[0]?.when === 'draft' ? 'ahead of the scheduled cycle' : 'in line with the planned cycle'}.`,
  )
  L.push('')
  L.push(`<b>Medical necessity criteria</b>`)
  list.forEach((x, i) =>
    L.push(`${i + 1}. ${x.t} — <b>${x.ok ? 'met' : 'pending'}</b>${x.note ? ' (' + x.note + ')' : ''}`),
  )
  L.push('')
  L.push(`<b>Supporting documentation attached</b>`)
  c.docs.forEach((d) => L.push(`• ${d[0]} — ${d[1]}`))
  L.push('')
  L.push(
    `Submitted electronically by BayouCare for Ochsner Oncology. ` +
      `AI-drafted from the chart — reviewed and signed by the ordering oncologist before submission.`,
  )
  return L.join('<br>')
}
