import { create } from 'zustand'

import { AUTH_CASES, REFERRALS, TB_CASES } from '@/data'
import type { BreastInput, ColoInput, LungInput } from '@/engine/screening'

const AUTH_IDS = Object.keys(AUTH_CASES)
const TB_IDS = Object.keys(TB_CASES)
const REF_IDS = (REFERRALS as Array<{ id: string }>).map((r) => r.id)

export type CdsKind = 'ldct' | 'breast' | 'colo'
export type CdsFilter = 'all' | CdsKind

/**
 * Clinic Ops worklist state — the provider-side surfaces (brief area 5).
 *
 * The legacy app kept all of this in module-scope `let`s — `authSel`, `tbSel`,
 * `refSel`, `refStep`, `cdsFilter` — that the render functions read and mutated
 * directly. Lifting it into a slice is what lets the five workflows be separate
 * components while still sharing one selection.
 *
 * It is also where the three DELIBERATE cross-module couplings live, all of
 * which were demo moments in the legacy and must keep working:
 *
 *  1. The prior-auth transport criterion reads `useTeam().applied`, so applying
 *     a Rank 1 counterfactual action on Care Team visibly strengthens a Rank 9
 *     packet. Both surfaces read the same `factorsFor()`.
 *  2. The no-show model scores slots from those same applied actions, so
 *     "Arrange rides (NEMT)" drops the probabilities on the slot board.
 *  3. `probe()` replaces `cdsProbe()`'s habit of reaching into the patient
 *     app's DOM inputs by id and assigning to them. The calculators now read
 *     their inputs from THIS store, so "Probe in patient app" is a plain state
 *     write plus a route change rather than a cross-tab DOM poke.
 *
 * Mode is deliberately absent: it lives in `ui` and nothing here may read it.
 */
interface ClinicState {
  /* Rank 9 — prior-auth autopilot */
  authId: string
  authSubmitted: Set<string>
  setAuthId: (id: string) => void
  submitAuth: (id: string) => void

  /* Rank 10 — tumor-board prep */
  tbId: string
  tbCirculated: Set<string>
  setTbId: (id: string) => void
  circulateTb: (id: string) => void

  /* Rank 11 — Referral Express */
  refId: string
  /** How far each referral has advanced along its timeline. */
  refStep: Record<string, number>
  setRefId: (id: string) => void
  advanceRef: (id: string) => void

  /* Rank 12 — PCP decision-support feed */
  cdsFilter: CdsFilter
  setCdsFilter: (f: CdsFilter) => void

  /* Rank 13 — no-show model + smart rebooking */
  /** Day offset 1-14 on the slot board. */
  slotDay: number
  /** Slots the rebooking pass has actioned, keyed `${pid}:${day}`. */
  slotApplied: Set<string>
  setSlotDay: (d: number) => void
  applyRebooking: (keys: string[]) => void

  /*
   * Shared calculator inputs — see coupling (3) above. Keyed by the SAME
   * vocabulary as the CDS feed (`ldct`, not `lung`), so a probe is a direct
   * keying rather than a translation between two names for one thing.
   */
  calc: { ldct: LungInput; breast: BreastInput; colo: ColoInput }
  /** Set one calculator's inputs. The calculators are controlled by this. */
  setCalc: (kind: CdsKind, inputs: LungInput | BreastInput | ColoInput) => void
  /**
   * CDS "Probe in patient app": seed a calculator and flag it to compute on
   * arrival. The legacy's `cdsProbe` called `calcLung()` itself, so the numbers
   * were already on screen when the tab switched — seeding the inputs alone
   * would land the user on a filled-in form with no result, which is not the
   * demo moment ("see the identical numbers on the patient side").
   */
  probe: (kind: CdsKind, inputs: LungInput | BreastInput | ColoInput) => void
  /** Which calculator a probe is waiting on, if any. */
  autoCalc: CdsKind | null
  clearAutoCalc: () => void

  reset: () => void
}

/*
 * Seeded with the values the three calculators already open on, so adopting the
 * shared slice changes nothing about a first visit to Screen & Prevent.
 */
const CALC_DEFAULTS = {
  ldct: { age: 62, packs: 40, status: 'current', quit: 0 } as LungInput,
  breast: { age: 42, fdr: 1, sig: 'none' } as BreastInput,
  colo: { age: 64, f: 'oneyoung' } as ColoInput,
}

export const useClinic = create<ClinicState>((set, get) => ({
  authId: AUTH_IDS[0],
  authSubmitted: new Set<string>(),
  setAuthId(id) {
    set({ authId: id })
  },
  submitAuth(id) {
    set({ authSubmitted: new Set(get().authSubmitted).add(id) })
  },

  tbId: TB_IDS.includes('yolanda') ? 'yolanda' : TB_IDS[0],
  tbCirculated: new Set<string>(),
  setTbId(id) {
    set({ tbId: id })
  },
  circulateTb(id) {
    set({ tbCirculated: new Set(get().tbCirculated).add(id) })
  },

  refId: REF_IDS[0],
  refStep: {},
  setRefId(id) {
    set({ refId: id })
  },
  advanceRef(id) {
    set((s) => ({ refStep: { ...s.refStep, [id]: (s.refStep[id] ?? 0) + 1 } }))
  },

  cdsFilter: 'all',
  setCdsFilter(f) {
    set({ cdsFilter: f })
  },

  slotDay: 0,
  slotApplied: new Set<string>(),
  setSlotDay(d) {
    set({ slotDay: d })
  },
  applyRebooking(keys) {
    set({ slotApplied: new Set([...get().slotApplied, ...keys]) })
  },

  calc: { ...CALC_DEFAULTS },
  setCalc(kind, inputs) {
    set((s) => ({ calc: { ...s.calc, [kind]: inputs } }))
  },
  probe(kind, inputs) {
    set((s) => ({ calc: { ...s.calc, [kind]: inputs }, autoCalc: kind }))
  },
  autoCalc: null,
  clearAutoCalc() {
    set({ autoCalc: null })
  },

  reset() {
    set({
      authId: AUTH_IDS[0],
      authSubmitted: new Set<string>(),
      tbId: TB_IDS.includes('yolanda') ? 'yolanda' : TB_IDS[0],
      tbCirculated: new Set<string>(),
      refId: REF_IDS[0],
      refStep: {},
      cdsFilter: 'all',
      slotDay: 0,
      slotApplied: new Set<string>(),
      calc: { ...CALC_DEFAULTS },
      autoCalc: null,
    })
  },
}))

export { AUTH_IDS, TB_IDS, REF_IDS }
