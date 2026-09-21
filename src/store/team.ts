import { create } from 'zustand'

import { TEAM } from '@/data'
import { ACTIONS, factorsFor, probOf, stateOf, type Factors } from '@/engine/team/risk'

export interface TeamPatient {
  id: string
  name: string
  meta: string
  checkin: string
  days: string
  f: Factors
  driver: string
}

export const TEAM_PATIENTS = TEAM as unknown as TeamPatient[]

/**
 * The care-team worklist.
 *
 * `applied` is the ONLY mutable state here; the risk numbers are derived from it
 * and the patient's baseline factors on every read.
 *
 * In the legacy app this was a pair of module-scope objects — `p._f`, a MUTATED
 * COPY of the patient's factors, and `applied[id]`, a Set — and the clinic-ops
 * no-show model read `p._f` directly. That coupling is a deliberate demo moment:
 * apply "Arrange rides" here and the no-show probabilities visibly drop on the
 * Clinic Ops tab. Modelling it as a shared store with a pure `factorsFor()` is
 * what keeps that true in React — copying the factors into component state would
 * silently sever it, and mutating an imported module would break the moment
 * anything memoised.
 */
interface TeamState {
  applied: Record<string, Set<string>>
  selectedId: string | null
  toggle: (id: string, key: string) => void
  autoApply: () => void
  select: (id: string | null) => void
  reset: () => void
}

const emptyApplied = () =>
  Object.fromEntries(TEAM_PATIENTS.map((p) => [p.id, new Set<string>()])) as Record<string, Set<string>>

export const useTeam = create<TeamState>((set, get) => ({
  applied: emptyApplied(),
  selectedId: null,

  toggle(id, key) {
    const next = new Set(get().applied[id] ?? [])
    if (next.has(key)) next.delete(key)
    else next.add(key)
    set((s) => ({ applied: { ...s.applied, [id]: next } }))
  },

  /** Every flagged patient gets their single best action. */
  autoApply() {
    const applied = { ...get().applied }
    for (const p of TEAM_PATIENTS) {
      const s = stateOf(factorsFor(p.f, applied[p.id] ?? new Set()))
      if (s.level !== 'none' && s.cfs[0]) {
        const next = new Set(applied[p.id] ?? [])
        next.add(s.cfs[0].key)
        applied[p.id] = next
      }
    }
    set({ applied })
  },

  select(id) {
    set({ selectedId: id })
  },

  reset() {
    set({ applied: emptyApplied(), selectedId: null })
  },
}))

/** Current risk for a patient, given whatever has been applied. */
export function riskOf(applied: ReadonlySet<string>, p: TeamPatient) {
  return stateOf(factorsFor(p.f, applied))
}

/** The raw probability, used by Clinic Ops. */
export function probabilityOf(applied: ReadonlySet<string>, p: TeamPatient) {
  return probOf(factorsFor(p.f, applied))
}

export { ACTIONS }
