import { create } from 'zustand'

import type { PatientId } from '@/data'

/**
 * The family circle's task state.
 *
 * The bundled record ships each task with a status (`done`, `in`, `open`,
 * `auto`), which is where it STARTED. Before this store there was no way for
 * anyone to change it: the family circle was a read-only list, so the one
 * surface in the app that models family participation could not be
 * participated in.
 *
 * Overrides live here rather than in the bundled data, for the same reason
 * appointments do — that record is imported module state shared by every
 * patient and every component, so writing to it would leak one family's
 * progress into the next patient's view.
 *
 * A task with no override keeps its bundled status. `done` is the only
 * transition offered: a family member can say "I've got this", and say it was
 * a mistake. Claiming and assigning are deliberately absent — they would need
 * real accounts to mean anything.
 */
interface FamilyState {
  /** `pid` → task index → done. Absent entirely means "untouched". */
  overrides: Partial<Record<PatientId, Record<number, boolean>>>
  setDone: (pid: PatientId, index: number, done: boolean) => void
  /** Undo every change for one patient, back to the bundled record. */
  reset: (pid: PatientId) => void
}

export const useFamily = create<FamilyState>((set) => ({
  overrides: {},

  setDone(pid, index, done) {
    set((s) => ({
      overrides: {
        ...s.overrides,
        [pid]: { ...(s.overrides[pid] ?? {}), [index]: done },
      },
    }))
  },

  reset(pid) {
    set((s) => {
      const next = { ...s.overrides }
      delete next[pid]
      return { overrides: next }
    })
  },
}))

/**
 * Whether a task reads as done: the override if a person has touched it, the
 * bundled status otherwise.
 *
 * `bundled` is passed in rather than looked up here so this stays a pure
 * function of its arguments — the same shape as `riskOf` in the team store.
 */
export function isDone(
  overrides: Record<number, boolean> | undefined,
  index: number,
  bundled: boolean,
): boolean {
  return overrides?.[index] ?? bundled
}
