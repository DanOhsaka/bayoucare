import { create } from 'zustand'

import { PATIENTS, REPLAY, type PatientId } from '@/data'
import { translate } from '@/lib/i18n'
import { remiLive, sweepRowFor, type SweepRow } from '@/engine/remi/live'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'

const T = (key: string) => translate(useUi.getState().lang, key)

/** The replay script: time, reading, message, style. */
export const REPLAY_STEPS = REPLAY as unknown as Array<[string, string, string, string]>

export interface VitalsAlert {
  name: string
  when: string
  reading: string
  msg: string
  followup: string
}

interface VitalsState {
  /** Live patch reading, in Celsius. */
  tempC: number
  /** Row 0 is the logged-in patient; the rest is the fixed ward panel. */
  sweep: SweepRow[]
  alerts: VitalsAlert[]
  /**
   * How many steps of the replay have played. Not reset when the run finishes —
   * the log has to survive completion, and the legacy's version did.
   */
  replayStep: number
  replaying: boolean
  smsVisible: boolean

  tick: () => void
  startReplay: () => void
  advanceReplay: () => void
  stopReplay: () => void
  resetForPatient: (pid: PatientId) => void
}

/** Captured at the start of a replay so a second run cannot stack a duplicate escalation. */
let sweepBase: SweepRow | null = null
let alertBase = 0

export const useVitals = create<VitalsState>((set, get) => ({
  tempC: 36.9,
  sweep: [sweepRowFor('darlene')],
  alerts: [],
  replayStep: 0,
  replaying: false,
  smsVisible: false,

  tick() {
    set({ tempC: +(36.7 + Math.random() * 0.5).toFixed(1) })
  },

  startReplay() {
    const { sweep, alerts, replaying } = get()
    if (replaying) return

    // Restore the pre-replay state first, so re-running cannot duplicate the
    // alert or leave the patient's row stuck flagged.
    if (sweepBase === null) sweepBase = { ...sweep[0] }
    if (alertBase === 0) alertBase = alerts.length

    set({
      sweep: [{ ...sweepBase }, ...sweep.slice(1)],
      alerts: alerts.slice(0, alertBase),
      replayStep: 0,
      replaying: true,
      smsVisible: false,
    })
  },

  /**
   * One step of the replay. Called on an interval by the screen.
   *
   * Step 2 is the demo moment: the patch crosses the neutropenic-fever
   * threshold, an alert is raised, AND the patient's row in the Morning Sweep
   * mutates. That last part is why the admin view shows the fever without
   * anything explicitly syncing it — both read this store.
   */
  advanceReplay() {
    const { replayStep, replaying, sweep, alerts } = get()
    if (!replaying) return

    if (replayStep >= REPLAY_STEPS.length) {
      // Stop ticking, but leave replayStep where it is so the log stays on
      // screen. Resetting it here is what emptied the log the moment the run
      // finished — the outcome, which is the whole point of the demo, vanished
      // as soon as it completed.
      set({ replaying: false })
      return
    }

    if (replayStep === 2) {
      const nextSweep = sweep.slice()
      nextSweep[0] = {
        ...nextSweep[0],
        temp: '38.6°C',
        tr: '↗',
        // The legacy asked for `vitals.darleneFlag`, which is not in the
        // dictionary — so the Morning Sweep showed the literal string
        // "vitals.darleneFlag" as the patient's flag. The key it meant is
        // `vitals.replayFlag`.
        flag: T('vitals.replayFlag'),
        flagCls: 'flag',
      }
      const nextAlerts: VitalsAlert[] = [
        ...alerts,
        {
          name: PATIENTS[usePatient.getState().pid].name,
          when: '2:14 am',
          reading: '38.6°C (101.5°F)',
          msg: T('vitals.alertMsg'),
          followup: T('vitals.alertFollow'),
        },
      ]
      set({ sweep: nextSweep, alerts: nextAlerts })
      remiLive.vitalsAlerts = nextAlerts as unknown as Array<Record<string, unknown>>
    }

    set({
      replayStep: replayStep + 1,
      smsVisible: get().smsVisible || replayStep === 3,
    })
  },

  stopReplay() {
    set({ replaying: false })
  },

  resetForPatient(pid) {
    sweepBase = null
    alertBase = 0
    set({
      sweep: [sweepRowFor(pid)],
      alerts: [],
      replayStep: 0,
      replaying: false,
      smsVisible: false,
    })
    remiLive.vitalsAlerts = []
  },
}))

/**
 * The patient's row in the sweep follows the bound record, exactly as
 * `applyPatient()` rebuilt `SWEEP[0]` in the legacy app. Without this the ward
 * table would keep showing whoever was signed in first.
 */
usePatient.subscribe((state, prev) => {
  if (state.pid !== prev.pid) useVitals.getState().resetForPatient(state.pid)
})
