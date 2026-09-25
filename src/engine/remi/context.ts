import {
 SWEEP_POP,
 TRIALS,
 type CalendarType,
 type Patient,
 type PlannedAppointment,
} from '@/data'
import { buildPlan, fmtDay as fmtDayBase, indexByDay, nextAppointment, upcoming } from '@/lib/calendar'
import { dayKey, today } from '@/lib/demoClock'
import { translate } from '@/lib/i18n'
import { getPatient, usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'
import { remiLive, sweepRowFor, type SweepRow } from '@/engine/remi/live'

const REMI_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * The bindings the extracted intent table expects to find in scope.
 *
 * The legacy file read these as module-scope variables that were rebound when
 * the patient changed. Here they are assembled per call from the stores, which
 * is the same thing without the rebinding — and it means an answer can never be
 * generated against a stale patient.
 */
export interface RemiContext {
 PATIENT: Patient
 CAL_TYPES: Record<string, CalendarType>
 trendBars: Patient['trend']
 vitalsAlerts: Array<Record<string, unknown>>
 answers: Record<string, number>
 SWEEP: SweepRow[]
 TRIALS: typeof TRIALS
 T: (key: string) => string
 fmtDay: (d: Date) => string
 remiNext: () => PlannedAppointment | undefined
 remiUpcoming: () => PlannedAppointment[]
 apptLine: (a: PlannedAppointment) => string
 remiDayLookup: (txt: string) => { date: Date; list: PlannedAppointment[] } | null
}

export function buildRemiContext(): RemiContext {
 const pid = usePatient.getState().pid
 const lang = useUi.getState().lang

 const PATIENT = getPatient(pid)
 const CAL_TYPES = PATIENT.calTypes
 const CAL_PLAN = buildPlan(PATIENT)
 const CAL_BY_DAY = indexByDay(CAL_PLAN)

 const T = (key: string) => translate(lang, key)
 const fmtDay = (d: Date) => fmtDayBase(d, lang)

 const remiUpcoming = () => upcoming(CAL_PLAN)
 const remiNext = () => nextAppointment(CAL_PLAN)

  const apptLine = (a: PlannedAppointment) => {
    const t = CAL_TYPES[a.type]
    return `<b>${fmtDay(a.date)} at ${a.time}</b> — ${t.label}, ${t.where} (${t.dur} min)`
  }

 /**
 * Resolve "today" / "tomorrow" / "Thursday" to a real day in the plan.
 *
 * Word boundaries matter: without them "money" contains "mon". The `|| 7`
 * means a named weekday always resolves to the COMING one, never today.
 */
 const remiDayLookup = (txt: string) => {
 const t = String(txt || '').toLowerCase()
 const anchor = today()
 let target: Date
 if (/\btoday\b/.test(t)) {
 target = new Date(anchor)
 } else if (/\btomorrow\b/.test(t)) {
 target = new Date(anchor)
 target.setDate(target.getDate() + 1)
 } else {
 const i = REMI_DAYS.findIndex((d) =>
 new RegExp('\\b(' + d + '|' + d.slice(0, 3) + ')\\b').test(t),
 )
 if (i < 0) return null
 const add = ((i - anchor.getDay()) + 7) % 7 || 7
 target = new Date(anchor)
 target.setDate(target.getDate() + add)
 }
 return { date: target, list: CAL_BY_DAY[dayKey(target)] || [] }
 }

 return {
 PATIENT,
 CAL_TYPES,
 trendBars: PATIENT.trend,
 vitalsAlerts: remiLive.vitalsAlerts,
 answers: remiLive.answers,
 // Row 0 is always the logged-in patient; the rest is the fixed ward table.
 SWEEP: [sweepRowFor(pid),...(SWEEP_POP as SweepRow[])],
 TRIALS,
 T,
 fmtDay,
 remiNext,
 remiUpcoming,
 apptLine,
 remiDayLookup,
 }
}
