import { useMemo } from 'react'
import { create } from 'zustand'

import { PATIENTS, type PatientId } from '@/data'
import {
  canBook,
  newApptId,
  withStatus,
  type Appointment,
  type BookingCheck,
} from '@/lib/appointments'
import { buildPlan, dateAtOffset } from '@/lib/calendar'
import { dayKey } from '@/lib/demoClock'

/** What the booking dialog collects. The date is derived from `off`. */
export interface BookingDraft {
  off: number
  time: string
  type: string
  ride: boolean
}

interface AppointmentsState {
  /**
   * Per-patient working copies.
   *
   * An entry that is ABSENT means "untouched — use the bundled record". The
   * store never mutates a patient's `calPlan`; it clones on first write. That
   * matters because the bundled data is imported module state shared by every
   * component and every patient switch — mutating it would leak one patient's
   * booking into the next one's calendar, and would survive a sign-out.
   */
  plans: Partial<Record<PatientId, Appointment[]>>
  /** Returns a refusal reason rather than silently doing nothing. */
  book: (pid: PatientId, draft: BookingDraft) => BookingCheck
  reschedule: (pid: PatientId, id: string, draft: BookingDraft) => BookingCheck
  cancel: (pid: PatientId, id: string) => void
  restore: (pid: PatientId, id: string) => void
  reset: (pid: PatientId) => void
}

/** The working copy for a patient, cloned from the record on first use. */
function copyFor(state: AppointmentsState, pid: PatientId): Appointment[] {
  return state.plans[pid] ?? withStatus(buildPlan(PATIENTS[pid]))
}

/** Appointments already sitting on the day a draft targets, excluding `except`. */
function dayApptsFor(list: Appointment[], off: number, except?: string): Appointment[] {
  const k = dayKey(dateAtOffset(off))
  return list.filter((a) => a.id !== except && dayKey(a.date) === k)
}

export const useAppointments = create<AppointmentsState>((set, get) => ({
  plans: {},

  book(pid, draft) {
    const list = copyFor(get(), pid)
    const check = canBook(draft.time, dayApptsFor(list, draft.off))
    if (!check.ok) return check

    const appt: Appointment = {
      id: newApptId(),
      off: draft.off,
      type: draft.type,
      time: draft.time,
      ride: draft.ride,
      date: dateAtOffset(draft.off),
      // Patient-initiated, so it is a REQUEST rather than a confirmed booking —
      // the clinic confirms, exactly as it would for a real request.
      status: 'requested',
      selfBooked: true,
    }
    set((s) => ({ plans: { ...s.plans, [pid]: [...list, appt] } }))
    return { ok: true }
  },

  reschedule(pid, id, draft) {
    const list = copyFor(get(), pid)
    const check = canBook(draft.time, dayApptsFor(list, draft.off, id))
    if (!check.ok) return check

    set((s) => ({
      plans: {
        ...s.plans,
        [pid]: list.map((a) =>
          a.id === id
            ? {
                ...a,
                off: draft.off,
                time: draft.time,
                date: dateAtOffset(draft.off),
                // Moving an appointment puts it back in front of the clinic, so
                // a confirmed slot becomes a request again rather than silently
                // staying confirmed at a time nobody agreed to.
                status: 'requested',
                selfBooked: true,
              }
            : a,
        ),
      },
    }))
    return { ok: true }
  },

  cancel(pid, id) {
    const list = copyFor(get(), pid)
    set((s) => ({
      plans: {
        ...s.plans,
        [pid]: list.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a)),
      },
    }))
  },

  /** Undo a cancellation — a mis-tap on a phone should not lose the slot. */
  restore(pid, id) {
    const list = copyFor(get(), pid)
    set((s) => ({
      plans: {
        ...s.plans,
        [pid]: list.map((a) => (a.id === id ? { ...a, status: 'confirmed' as const } : a)),
      },
    }))
  },

  /** Drop the working copy, falling back to the bundled record. */
  reset(pid) {
    set((s) => {
      const next = { ...s.plans }
      delete next[pid]
      return { plans: next }
    })
  },
}))

/**
 * The effective plan for a patient: their working copy when they have one, the
 * bundled record otherwise. Derived, never rebound — the same pattern the
 * patient store uses for identity.
 */
export function usePlan(pid: PatientId): Appointment[] {
  const override = useAppointments((s) => s.plans[pid])
  return useMemo(() => override ?? withStatus(buildPlan(PATIENTS[pid])), [override, pid])
}
