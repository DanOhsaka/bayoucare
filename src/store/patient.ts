import { create } from 'zustand'
import { PATIENTS, type PatientId } from '@/data'

/**
 * Which patient record is bound to the session.
 *
 * This store replaces the legacy `applyPatient()`, which rebound a dozen
 * module-scope variables (PID, PATIENT, MY_SURV, trendBars, CAL_TYPES,
 * CAL_PLAN) and then manually re-ran four renderers, backed by a `RERENDER`
 * array so a language switch could re-apply the identity on top.
 *
 * Here, `pid` is the only state. Everything derived from it — the record, the
 * calendar plan, the trend, the sweep row — becomes a selector at the point of
 * use, so there is nothing to rebind and nothing to remember to re-render.
 *
 * Note the distinction the legacy file was careful about and this preserves:
 * SESSION identity (email, role) and PATIENT identity (which record is shown)
 * are separate concepts. A clinician's session is bound to whichever patient
 * they have selected.
 */
interface PatientState {
  pid: PatientId
  setPatient: (id: PatientId) => void
  /** Bind the record the server says this account owns. */
  loadFromServer: () => Promise<void>
}

export const usePatient = create<PatientState>((set) => ({
  pid: 'darlene',

  setPatient: (pid) => {
    if (!(pid in PATIENTS)) return
    set({ pid })
  },

  /**
   * GET /api/patient — reachable only after a successful sign-in.
   *
   * Every failure path is swallowed on purpose, matching the legacy behaviour:
   * the bundled record is a complete fallback, so a database hiccup should
   * degrade to it rather than block the app. The 2.5s abort keeps a cold Neon
   * instance (measured at ~7.7s) from stalling the sign-in gate.
   */
  async loadFromServer() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    try {
      const res = await fetch('/api/patient', { cache: 'no-store', signal: controller.signal })
      if (!res.ok) return
      const json = (await res.json()) as { id?: string }
      if (json?.id && json.id in PATIENTS) {
        set({ pid: json.id as PatientId })
      }
    } catch {
      /* offline, aborted, or malformed — the bundled record stands */
    } finally {
      clearTimeout(timer)
    }
  },
}))
