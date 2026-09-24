import { create } from 'zustand'
import { PATIENTS, type DemoPatientId, type Patient, type PatientId } from '@/data'
import {
  createFreshPatient,
  deriveChip,
  deriveProfile,
  deriveShort,
  isProfileComplete,
} from '@/data/freshPatient'

const storageKey = (email: string) => `bc-self-profile:${email.trim().toLowerCase()}`

export interface SelfProfileDraft {
  name: string
  age: string
  city: string
  dx: string
  stage: string
  subtype: string
  grade: string
  dxDate: string
  /** planning | active | done */
  phase: 'planning' | 'active' | 'done'
  cycleDay: string
  cycleTotal: string
  cycle: string
}

interface StoredSelf {
  record: Patient
  profileComplete: boolean
}

interface PatientState {
  pid: PatientId
  /** Live chart for Clerk / real accounts (`pid === 'self'`). */
  selfRecord: Patient | null
  profileComplete: boolean
  /** Email used to persist the self chart across refresh. */
  selfEmail: string | null
  /** Session overlays for demo charts (and self fallback) — name/age/city/short. */
  chartPatches: Partial<Record<PatientId, ChartBasicsPatch>>
  setPatient: (id: PatientId) => void
  /** Bind the record the server says this account owns (demo Neon logins). */
  loadFromServer: () => Promise<void>
  /** Start a fresh (or restored) chart for a Clerk sign-in. */
  beginSelfSession: (opts: {
    email: string
    name: string
    username?: string | null
  }) => void
  saveSelfProfile: (draft: SelfProfileDraft) => void
  /** Edit the sidebar profile fields (name, age, city, status line). */
  updateSidebarProfile: (patch: ChartBasicsPatch) => void
  clearSelf: () => void
}

/** Fields shown on the My Care sidebar profile card. */
export type ChartBasicsPatch = {
  name: string
  age: number
  city: string
  /** Second line — e.g. "Alexandria, LA · Survivorship, year 6". */
  short: string
}

function applyDerived(p: Patient): Patient {
  return {
    ...p,
    chip: deriveChip(p),
    short: deriveShort(p),
    profile: deriveProfile(p),
  }
}

function readStored(email: string): StoredSelf | null {
  try {
    const raw = localStorage.getItem(storageKey(email))
    if (!raw) return null
    return JSON.parse(raw) as StoredSelf
  } catch {
    return null
  }
}

function writeStored(email: string, data: StoredSelf) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(data))
  } catch {
    /* private mode / quota — in-memory still works for the session */
  }
}

/**
 * Which patient record is bound to the session.
 *
 * Demo accounts keep using the bundled JSON. Real Clerk accounts use `self`
 * plus `selfRecord` so the chart starts empty and is filled from My Plan.
 */
export const usePatient = create<PatientState>((set, get) => ({
  pid: 'darlene',
  selfRecord: null,
  profileComplete: true,
  selfEmail: null,
  chartPatches: {},

  setPatient: (pid) => {
    if (pid === 'self') {
      const { selfRecord } = get()
      if (!selfRecord) return
      set({ pid: 'self', profileComplete: isProfileComplete(selfRecord) })
      return
    }
    if (!(pid in PATIENTS)) return
    set({ pid, profileComplete: true })
  },

  async loadFromServer() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    try {
      const res = await fetch('/api/patient', { cache: 'no-store', signal: controller.signal })
      if (!res.ok) return
      const json = (await res.json()) as { id?: string }
      if (json?.id && json.id in PATIENTS) {
        set({
          pid: json.id as DemoPatientId,
          selfRecord: null,
          profileComplete: true,
          selfEmail: null,
        })
      }
    } catch {
      /* offline, aborted, or malformed — the bundled record stands */
    } finally {
      clearTimeout(timer)
    }
  },

  beginSelfSession({ email, name, username }) {
    const preferred =
      name.trim() ||
      (username?.trim() ? username.trim() : '') ||
      email.split('@')[0] ||
      'Friend'

    const stored = readStored(email)
    if (stored?.record) {
      const merged = applyDerived({
        ...stored.record,
        name: stored.record.name?.trim() ? stored.record.name : preferred,
      })
      set({
        pid: 'self',
        selfRecord: merged,
        profileComplete: stored.profileComplete || isProfileComplete(merged),
        selfEmail: email,
      })
      return
    }

    const record = applyDerived(createFreshPatient({ name: preferred }))
    set({
      pid: 'self',
      selfRecord: record,
      profileComplete: false,
      selfEmail: email,
    })
    writeStored(email, { record, profileComplete: false })
  },

  saveSelfProfile(draft) {
    const { selfRecord, selfEmail } = get()
    const base = selfRecord ?? createFreshPatient({ name: draft.name || 'Friend' })
    const age = Number.parseInt(draft.age, 10)
    const cycleDay = Number.parseInt(draft.cycleDay, 10)
    const cycleTotal = Number.parseInt(draft.cycleTotal, 10)
    const cycle = Number.parseInt(draft.cycle, 10)

    const next = applyDerived({
      ...base,
      name: draft.name.trim() || base.name,
      age: Number.isFinite(age) && age > 0 ? age : 0,
      city: draft.city.trim(),
      dx: draft.dx.trim(),
      stage: draft.stage.trim(),
      subtype: draft.subtype.trim(),
      grade: draft.grade.trim(),
      dxDate: draft.dxDate.trim(),
      cycleDay:
        draft.phase === 'active' && Number.isFinite(cycleDay) && cycleDay > 0 ? cycleDay : 0,
      cycleTotal:
        draft.phase === 'active' && Number.isFinite(cycleTotal) && cycleTotal > 0
          ? cycleTotal
          : 0,
      cycle: draft.phase === 'active' && Number.isFinite(cycle) && cycle > 0 ? cycle : 0,
      surv: null,
    })

    const complete = isProfileComplete(next)
    set({ selfRecord: next, profileComplete: complete, pid: 'self' })
    if (selfEmail) writeStored(selfEmail, { record: next, profileComplete: complete })
  },

  updateSidebarProfile(patch) {
    const { pid, selfRecord, selfEmail, chartPatches } = get()
    const name = patch.name.trim() || 'Friend'
    const age = Number.isFinite(patch.age) && patch.age > 0 ? Math.round(patch.age) : 0
    const city = patch.city.trim()
    const short = patch.short.trim()

    if (pid === 'self') {
      const base = selfRecord ?? createFreshPatient({ name })
      const next: Patient = {
        ...base,
        name,
        age,
        city,
        short:
          short ||
          deriveShort({
            ...base,
            name,
            age,
            city,
          }),
        profile: deriveProfile({
          ...base,
          name,
          age,
          city,
        }),
      }
      const complete = isProfileComplete(next)
      set({ selfRecord: next, profileComplete: complete, pid: 'self' })
      if (selfEmail) writeStored(selfEmail, { record: next, profileComplete: complete })
      return
    }

    set({
      chartPatches: {
        ...chartPatches,
        [pid]: { name, age, city, short: short || getPatientBase(pid).short },
      },
    })
  },

  clearSelf() {
    set({
      selfRecord: null,
      profileComplete: true,
      selfEmail: null,
      pid: 'darlene',
      chartPatches: {},
    })
  },
}))

function getPatientBase(pid: PatientId): Patient {
  if (pid === 'self') {
    return usePatient.getState().selfRecord ?? createFreshPatient({ name: 'Friend' })
  }
  return PATIENTS[pid]
}

function applyPatch(base: Patient, patch: ChartBasicsPatch | undefined): Patient {
  if (!patch) return base
  return {
    ...base,
    name: patch.name,
    age: patch.age,
    city: patch.city,
    short: patch.short,
    profile: deriveProfile({
      ...base,
      name: patch.name,
      age: patch.age,
      city: patch.city,
    }),
  }
}

/** Resolve the live chart for any pid (works outside React). */
export function getPatient(pid: PatientId = usePatient.getState().pid): Patient {
  const { chartPatches } = usePatient.getState()
  return applyPatch(getPatientBase(pid), chartPatches[pid])
}

/** Reactive chart for the bound patient. */
export function useActivePatient(): Patient {
  const pid = usePatient((s) => s.pid)
  const selfRecord = usePatient((s) => s.selfRecord)
  const patch = usePatient((s) => s.chartPatches[pid])
  const base =
    pid === 'self'
      ? selfRecord ?? createFreshPatient({ name: 'Friend' })
      : PATIENTS[pid]
  return applyPatch(base, patch)
}
