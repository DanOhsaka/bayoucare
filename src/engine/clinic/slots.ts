/* ============================================================================
   Rank 13 · no-show model + smart rebooking — the whole model, as pure logic.

   Three things about this one are load-bearing:

   1. THE COUPLING. The shared half of every probability is the SAME feature
      vector the care-team dashboard scores — `factorsFor(p.f, applied.team[pid])`.
      The legacy read `p._f`, a mutated copy of the patient's factors that Rank
      1's applyAction wrote into. Here it is recomputed from the applied set on
      every read, so applying "Arrange rides (NEMT)" on the Care Team tab drops
      these probabilities without either tab knowing about the other. Nothing
      here mutates a patient's factors, and nothing here may be lifted into
      component state — that is what keeps the coupling alive.

   2. DETERMINISM. `makeSlots` is seeded off the patient id, so the 14-day board
      is byte-identical on every reload. Nothing here reads a clock: a slot's
      lead time is its day offset, not a date.

   3. SLOT ACTIONS. The legacy kept `slotApplied[slotId]`, a Set of action keys
      per slot. The clinic store keeps ONE flat `Set<string>` for the tab and
      only ever adds to it, so an action is keyed `${pid}:${day}:${action}` —
      the slot's own `${pid}:${day}` identity plus which of the three it was.
      They have to stay distinct: `overbook` and `smsLadder` move the
      probability, `protect` only counts.
   ========================================================================= */
import { SLOT_TIMES, SLOT_TYPES } from '@/data'
import { mulberry32, sh } from '@/engine/population/parishes'
import { sigmoid } from '@/engine/screening'
import { factorsFor, type Factors } from '@/engine/team/risk'
import { TEAM_PATIENTS, type TeamPatient } from '@/store/team'

/** The five appointment types, in the order the seeded draw walks them. */
export const SLOT_KEYS = Object.keys(SLOT_TYPES)

export interface Slot {
  id: string
  pid: string
  day: number
  time: string
  type: string
  res: string
  dur: number
  leadDays: number
  prior: number
}

/* ------------------------------------------------------- the slot generator */

/**
 * A patient's next 14 days.
 *
 * The draw order is the legacy's — type, then time, then prior no-shows — so
 * the same board comes out of the same seed. Reordering those three reads
 * silently changes every number on the screen.
 */
export function makeSlots(pid: string): Slot[] {
  const r = mulberry32(sh(pid + '|slots'))
  return Array.from({ length: 14 }, (_, d) => {
    let x = r()
    let acc = 0
    let type = 'followup'
    for (const k of SLOT_KEYS) {
      acc += SLOT_TYPES[k].w
      if (x <= acc) {
        type = k
        break
      }
    }
    return {
      id: pid + '-d' + d,
      pid,
      day: d + 1,
      // `time` is drawn before `prior` — keep them in this order.
      time: SLOT_TIMES[Math.floor(r() * SLOT_TIMES.length)],
      type,
      res: SLOT_TYPES[type].res,
      dur: SLOT_TYPES[type].dur,
      leadDays: d + 1,
      prior: Math.floor(r() * 3),
    }
  })
}

/** The whole clinic's board, generated once at module load. */
export const SLOTS: Slot[] = TEAM_PATIENTS.flatMap((p) => makeSlots(p.id))

export function slotPatient(s: Slot): TeamPatient | undefined {
  return TEAM_PATIENTS.find((x) => x.id === s.pid)
}

/* --------------------------------------------------------------- the model */

/**
 * Weights for the no-show logistic — deliberately legible next to Rank 1's `W`:
 * same sigmoid, overlapping features, different target. Calibrated so a
 * low-risk patient sits near 5% and the worst case near 60%, which lands
 * roughly a quarter of slots over the 35% triage threshold.
 */
export const NW = { miles: 0.013, sdoh: 1.0, days: 0.3, prior: 0.55, lead: 0.06, B0: -3.9 } as const

/** The triage threshold: "slots above 35% risk". */
export const NO_SHOW_HI = 0.35
/** Below this a slot is not worth a reminder ladder. */
export const NO_SHOW_NUDGE = 0.2

export const SLOT_ACTIONS = {
  smsLadder: { label: 'SMS ladder', desc: 'T-72h / T-24h / T-2h reminders, reply-to-confirm' },
  overbook: { label: 'Overbook', desc: 'Seat a waiting patient against a likely no-show' },
  protect: { label: 'Protect', desc: 'Hold this chair for the highest-need patient' },
} as const

export type SlotActionKey = keyof typeof SLOT_ACTIONS

/** The detail card's button order, as the legacy rendered it. */
export const SLOT_ACTION_KEYS = Object.keys(SLOT_ACTIONS) as SlotActionKey[]

/**
 * Both halves of the applied state, together — the Rank 1 worklist keyed by
 * patient id, and the Rank 13 slot actions. Every read of the model needs both,
 * so they travel as one argument.
 */
export interface Applied {
  team: Record<string, ReadonlySet<string>>
  slots: ReadonlySet<string>
}

const EMPTY: ReadonlySet<string> = new Set<string>()
const NO_FACTORS: Factors = { anc: 0, days: 0, adm: 0, miles: 0, sdoh: 0, cycle: 0 }

/** A slot's own identity — the `${pid}:${day}` the clinic store names. */
export const slotKey = (pid: string, day: number) => `${pid}:${day}`

/** One action taken on one slot; the action is part of the key so the three
 *  never collide. */
export const slotActionKey = (pid: string, day: number, action: SlotActionKey) =>
  `${slotKey(pid, day)}:${action}`

/** Which of the three actions this slot has had. */
export function slotActions(applied: Applied, s: Slot): SlotActionKey[] {
  return SLOT_ACTION_KEYS.filter((k) => applied.slots.has(slotActionKey(s.pid, s.day, k)))
}

/**
 * The patient's feature vector AFTER the applied counterfactuals — the port of
 * the legacy's `p._f`. Recomputed, never mutated; this is the call that carries
 * the cross-module coupling.
 */
export function slotFactors(s: Slot, applied: Applied): Factors {
  const p = slotPatient(s)
  return factorsFor(p ? p.f : NO_FACTORS, applied.team[s.pid] ?? EMPTY)
}

/** The logistic itself, given an already-factored vector. */
function noShowFrom(s: Slot, f: Factors, actions: SlotActionKey[]): number {
  const prior = actions.includes('overbook') ? Math.max(0, s.prior - 1) : s.prior
  const lead = actions.includes('smsLadder') ? s.leadDays * 0.6 : s.leadDays
  return sigmoid(
    NW.B0 +
      NW.miles * f.miles +
      NW.sdoh * f.sdoh +
      NW.days * f.days +
      NW.prior * prior +
      NW.lead * lead,
  )
}

/**
 * The probability this appointment is missed.
 *
 * Built on the shared risk features — the patient's miles, SDOH instability and
 * missed check-ins after whatever the care team has applied — plus two
 * slot-level modifiers: an overbooked slot carries one fewer prior no-show, and
 * a scheduled SMS ladder shortens the lead.
 */
export function noShowOf(s: Slot, applied: Applied): number {
  const p = slotPatient(s)
  if (!p) return 0
  return noShowFrom(s, factorsFor(p.f, applied.team[p.id] ?? EMPTY), slotActions(applied, s))
}

/**
 * The chips under "What is driving it".
 *
 * `f` is the FACTORED vector, not the baseline — the legacy read `p._f` here
 * too, which is why applying "Arrange rides (NEMT)" makes "42 mi to site"
 * vanish from this list as well as dropping the percentage.
 */
export function slotReasons(s: Slot, f: Factors): string[] {
  const out: string[] = []
  if (f.miles >= 40) out.push(Math.round(f.miles) + ' mi to site')
  if (f.sdoh) out.push('SDOH instability')
  if (f.days >= 2) out.push(f.days + ' missed check-ins')
  if (s.prior >= 1) out.push(s.prior + ' prior no-show' + (s.prior > 1 ? 's' : ''))
  if (s.leadDays >= 7) out.push('long lead — ' + s.leadDays + ' days out')
  return out
}

export type SlotBand = 'hi' | 'md' | 'lo'

export function slotBand(p: number): SlotBand {
  return p >= NO_SHOW_HI ? 'hi' : p >= NO_SHOW_NUDGE ? 'md' : 'lo'
}

export interface RebookRow {
  s: Slot
  p: number
  why: string[]
  actions: SlotActionKey[]
}

export interface RebookPlan {
  rows: RebookRow[]
  /** Slots at or above the triage threshold. */
  protect: RebookRow[]
  /** Slots worth a reminder ladder but short of a triage flag. */
  nudge: RebookRow[]
  /** Infusion chairs explicitly held for a higher-need patient. */
  chairs: number
  /** Expected no-shows avoided, counting every flagged slot landing at 12%. */
  avoided: number
}

export function rebookPlan(applied: Applied): RebookPlan {
  const rows: RebookRow[] = SLOTS.map((s) => {
    const f = slotFactors(s, applied)
    const actions = slotActions(applied, s)
    return { s, p: noShowFrom(s, f, actions), why: slotReasons(s, f), actions }
  })
  const protect = rows.filter((x) => x.p >= NO_SHOW_HI)
  const nudge = rows.filter((x) => x.p >= NO_SHOW_NUDGE && x.p < NO_SHOW_HI)
  const chairs = protect.filter(
    (x) => x.s.type === 'infusion' && x.actions.includes('protect'),
  ).length
  const avoided = protect.reduce((a, x) => a + (x.p - 0.12), 0)
  return { rows, protect, nudge, chairs, avoided }
}
