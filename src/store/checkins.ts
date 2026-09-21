import { create } from 'zustand'

import { PATIENTS, type PatientId } from '@/data'
import { remiLive } from '@/engine/remi/live'
import { translate } from '@/lib/i18n'
import { useUi } from '@/store/ui'

const T = (key: string) => translate(useUi.getState().lang, key)

/** The four scored questions. The mood trio is optional. */
export const REQUIRED_QUESTIONS = ['energy', 'nausea', 'fever', 'pain'] as const
const MOOD_QUESTIONS = ['mood1', 'mood2', 'mood3'] as const

export interface CheckinOutcome {
  ok: boolean
  /** Shown as a toast when the check-in could not be recorded. */
  reason?: string
  lead?: string
  /** The one flagged finding, rendered emphasised rather than as markup. */
  flag?: { kind: 'fever' | 'pain' | 'energy' | 'normal'; text: string }
  mood?: string
  moodTier?: number
  toast?: string
}

interface CheckinsState {
  answers: Record<string, number>
  trendBars: Array<{ v: number; label: string; cls: string }>
  checkinCount: number
  summary: CheckinOutcome | null

  setAnswer: (question: string, value: number) => void
  submit: () => CheckinOutcome
  resetForPatient: (pid: PatientId) => void
}

const freshTrend = (pid: PatientId) => PATIENTS[pid].trend.map((d) => ({ ...d }))

export const useCheckins = create<CheckinsState>((set, get) => ({
  answers: {},
  trendBars: freshTrend('darlene'),
  checkinCount: 0,
  summary: null,

  setAnswer(question, value) {
    const answers = { ...get().answers, [question]: value }
    set({ answers })
    // Remi's "how have I been feeling" intent reads the answer count, so an
    // answer has to be reflected there or it reports a stale figure.
    remiLive.answers = answers
  },

  submit(): CheckinOutcome {
    const { answers, trendBars, checkinCount } = get()

    const missing = REQUIRED_QUESTIONS.filter((k) => answers[k] === undefined)
    if (missing.length) {
      return { ok: false, reason: 'Please answer all 4 questions (1–5 each) first.' }
    }

    const overall =
      (answers.energy + answers.nausea + answers.fever + answers.pain) / REQUIRED_QUESTIONS.length

    // Push the new score and drop the oldest — a rolling window of five.
    const nextTrend = trendBars.slice()
    nextTrend.push({
      v: +overall.toFixed(1),
      label: 'Today',
      cls: overall > 3.6 ? 'hi' : overall >= 3 ? 'mid' : 'lo',
    })
    nextTrend.shift()

    const n = checkinCount + 1
    const feverRisk = answers.fever >= 4
    const painRisk = answers.pain >= 5
    const energyLow = answers.energy <= 2

    const lead =
      `Check-in #${n} recorded: energy ${answers.energy}/5, nausea ${answers.nausea}/5, ` +
      `fever ${answers.fever}/5, pain ${answers.pain}/5. Overall wellness ${overall.toFixed(1)}/5 — `

    let flag: CheckinOutcome['flag']
    if (feverRisk) {
      flag = {
        kind: 'fever',
        text:
          '⚠️ FEVER FLAG: temperature concerns match the 100.4°F+ threshold — a critical alert is being sent to the on-call nurse now. This is a red-flag condition and someone will call you within 30 minutes.',
      }
    } else if (painRisk) {
      flag = { kind: 'pain', text: '⚠️ Pain escalation flagged for same-day nurse review.' }
    } else if (energyLow) {
      flag = {
        kind: 'energy',
        text:
          "Energy is low — the AI suggests reminding your nurse to discuss fatigue management at Thursday's visit. No urgent flags.",
      }
    } else {
      flag = {
        kind: 'normal',
        text:
          'within expected range for day 4 of chemotherapy. No urgent flags — a short summary is routed to Marie (nurse navigator).',
      }
    }

    // The mood check is optional: it only counts if all three were answered.
    let mood: string | undefined
    let moodTier = 0
    if (MOOD_QUESTIONS.every((k) => answers[k] !== undefined)) {
      const total = MOOD_QUESTIONS.reduce((sum, k) => sum + answers[k], 0)
      moodTier = total >= 5 ? 3 : total >= 3 ? 2 : total >= 1 ? 1 : 0
      mood = T(`mood.sum${moodTier}`).replace('{n}', String(total))
    }

    const toast = feverRisk
      ? '🚨 Critical flag sent to your care team. Someone will call you soon.'
      : moodTier === 3
        ? T('mood.toastHigh')
        : moodTier === 2
          ? T('mood.toastMod')
          : '✅ Check-in saved. Your nurse got a short summary.'

    const outcome: CheckinOutcome = { ok: true, lead, flag, mood, moodTier, toast }
    set({ trendBars: nextTrend, checkinCount: n, summary: outcome })
    return outcome
  },

  /**
   * The trend is a per-patient COPY — submitting a check-in pushes to it, and
   * the registry entry has to survive a patient switch unmutated.
   */
  resetForPatient(pid) {
    set({ answers: {}, trendBars: freshTrend(pid), checkinCount: 0, summary: null })
    remiLive.answers = {}
  },
}))
