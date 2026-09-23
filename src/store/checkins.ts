import { create } from 'zustand'

import { PATIENTS, type PatientId } from '@/data'
import { remiLive } from '@/engine/remi/live'
import { translate } from '@/lib/i18n'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'

const T = (key: string) => translate(useUi.getState().lang, key)

/** The four scored questions. The mood trio is optional. */
export const REQUIRED_QUESTIONS = ['energy', 'nausea', 'fever', 'pain'] as const
const MOOD_QUESTIONS = ['mood1', 'mood2', 'mood3'] as const

export interface CheckinOutcome {
  ok: boolean
  /** Shown as a toast when the check-in could not be recorded. */
  reason?: string
  /** Check-in ordinal shown in the summary header. */
  checkinNumber?: number
  /** The four scored answers, for chip display. */
  scores?: { energy: number; nausea: number; fever: number; pain: number }
  /** Mean of the four scored answers, one decimal. */
  overall?: number
  /** Kept for Remi / trend note parsers that still read the prose lead. */
  lead?: string
  /** The one flagged finding, rendered emphasised rather than as markup. */
  flag?: { kind: 'fever' | 'pain' | 'energy' | 'normal'; text: string }
  mood?: string
  moodTier?: number
  /** Mood total 0–6 when all three mood questions were answered. */
  moodTotal?: number
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

function raiseCheckinAlert(args: {
  kind: string
  reading: string
  msg: string
  followup: string
  level?: 'critical' | 'watch'
}) {
  const pid = usePatient.getState().pid
  useVitals.getState().raiseAlert({
    name: PATIENTS[pid].name,
    when: 'Just now',
    reading: args.reading,
    msg: args.msg,
    followup: args.followup,
    source: 'checkin',
    kind: args.kind,
    level: args.level ?? 'critical',
  })
}

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

    const scores = {
      energy: answers.energy,
      nausea: answers.nausea,
      fever: answers.fever,
      pain: answers.pain,
    }
    const lead =
      `Check-in #${n} recorded: energy ${scores.energy}/5, nausea ${scores.nausea}/5, ` +
      `fever ${scores.fever}/5, pain ${scores.pain}/5. Overall wellness ${overall.toFixed(1)}/5 — `

    let flag: CheckinOutcome['flag']
    if (feverRisk) {
      flag = {
        kind: 'fever',
        text:
          'Fever flag: temperature concerns match the 100.4°F+ threshold. This is now on your care team’s Needs attention list — Marie (RN) can see it.',
      }
      raiseCheckinAlert({
        kind: 'fever',
        reading: `Fever score ${scores.fever}/5`,
        msg: 'Patient-reported fever concern on daily check-in (≥4/5). Neutropenic-fever pathway.',
        followup: 'On-call RN · same-day outreach · confirm temp and ANC plan',
        level: 'critical',
      })
    } else if (painRisk) {
      flag = {
        kind: 'pain',
        text: 'Pain escalation is on your care team’s Needs attention list for same-day nurse review.',
      }
      raiseCheckinAlert({
        kind: 'pain',
        reading: `Pain score ${scores.pain}/5`,
        msg: 'Patient-reported severe pain on daily check-in (5/5).',
        followup: 'Marie Thibodeaux, RN · same-day review',
        level: 'critical',
      })
    } else if (energyLow) {
      flag = {
        kind: 'energy',
        text:
          "Energy looks low. We'll remind your nurse to discuss fatigue management at Thursday's visit. No urgent flags.",
      }
    } else {
      flag = {
        kind: 'normal',
        text:
          'Within expected range for day 4 of chemotherapy. No urgent flags — a short summary is routed to Marie (nurse navigator).',
      }
    }

    // The mood check is optional: it only counts if all three were answered.
    let mood: string | undefined
    let moodTier = 0
    let moodTotal: number | undefined
    if (MOOD_QUESTIONS.every((k) => answers[k] !== undefined)) {
      moodTotal = MOOD_QUESTIONS.reduce((sum, k) => sum + answers[k], 0)
      moodTier = moodTotal >= 5 ? 3 : moodTotal >= 3 ? 2 : moodTotal >= 1 ? 1 : 0
      mood = T(`mood.sum${moodTier}`).replace('{n}', String(moodTotal))
      if (moodTier >= 2) {
        raiseCheckinAlert({
          kind: 'mood',
          reading: `Mood total ${moodTotal}/6`,
          msg:
            moodTier >= 3
              ? 'High mood distress on optional check-in. Patient was shown 988 and care-team outreach.'
              : 'Elevated mood distress on optional check-in. Social work follow-up suggested.',
          followup:
            moodTier >= 3
              ? 'Keisha Brown (SW) · Marie Thibodeaux, RN · reach out today'
              : 'Keisha Brown (SW) · outreach this week',
          level: moodTier >= 3 ? 'critical' : 'watch',
        })
      }
    }

    const toast = feverRisk
      ? 'Critical flag sent to your care team’s Needs attention list.'
      : moodTier === 3
        ? T('mood.toastHigh')
        : moodTier === 2
          ? T('mood.toastMod')
          : 'Check-in saved. Your nurse got a short summary.'

    const outcome: CheckinOutcome = {
      ok: true,
      checkinNumber: n,
      scores,
      overall: +overall.toFixed(1),
      lead,
      flag,
      mood,
      moodTier,
      moodTotal,
      toast,
    }
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

/**
 * Same patient-boundary rule as vitals: without this, every account inherits
 * Darlene's trend bars and answers from module init.
 */
usePatient.subscribe((state, prev) => {
  if (state.pid !== prev.pid) useCheckins.getState().resetForPatient(state.pid)
})
