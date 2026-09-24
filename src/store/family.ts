import { create } from 'zustand'

import type { PatientId } from '@/data'

export type FamilyInviteChannel = 'email' | 'sms' | 'both'

export type FamilyInvite = {
  id: string
  patientId: PatientId
  name: string
  email?: string
  phone?: string
  channel: FamilyInviteChannel
  /** When the patient queued the invite. */
  sentAt: string
  /** How delivery was handed off. */
  delivery: 'email' | 'sms' | 'email+sms' | 'share'
}

/**
 * The family circle's task state + invite history.
 *
 * The bundled record ships each task with a status (`done`, `in`, `open`,
 * `auto`), which is where it STARTED. Overrides live here rather than in the
 * bundled data for the same reason appointments do.
 *
 * Invites are recorded when the patient opens mail/SMS (or Resend succeeds) so
 * the Family help screen can show who was asked to help.
 */
interface FamilyState {
  /** `pid` → task index → done. Absent entirely means "untouched". */
  overrides: Partial<Record<PatientId, Record<number, boolean>>>
  invites: FamilyInvite[]
  setDone: (pid: PatientId, index: number, done: boolean) => void
  addInvite: (invite: Omit<FamilyInvite, 'id' | 'sentAt'> & { id?: string }) => FamilyInvite
  /** Undo every change for one patient, back to the bundled record. */
  reset: (pid: PatientId) => void
}

export const useFamily = create<FamilyState>((set) => ({
  overrides: {},
  invites: [],

  setDone(pid, index, done) {
    set((s) => ({
      overrides: {
        ...s.overrides,
        [pid]: { ...(s.overrides[pid] ?? {}), [index]: done },
      },
    }))
  },

  addInvite(partial) {
    const invite: FamilyInvite = {
      id: partial.id ?? `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sentAt: new Date().toISOString(),
      patientId: partial.patientId,
      name: partial.name,
      email: partial.email,
      phone: partial.phone,
      channel: partial.channel,
      delivery: partial.delivery,
    }
    set((s) => ({ invites: [invite, ...s.invites].slice(0, 40) }))
    return invite
  },

  reset(pid) {
    set((s) => {
      const next = { ...s.overrides }
      delete next[pid]
      return {
        overrides: next,
        invites: s.invites.filter((i) => i.patientId !== pid),
      }
    })
  },
}))

/**
 * Whether a task reads as done: the override if a person has touched it, the
 * bundled status otherwise.
 */
export function isDone(
  overrides: Record<number, boolean> | undefined,
  index: number,
  bundled: boolean,
): boolean {
  return overrides?.[index] ?? bundled
}

export function invitesForPatient(invites: FamilyInvite[], pid: PatientId) {
  return invites.filter((i) => i.patientId === pid)
}
