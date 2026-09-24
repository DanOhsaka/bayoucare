/**
 * Typed access to the extracted BayouCare data.
 *
 * The JSON was sliced out of the legacy file programmatically (`extract.js` in
 * bayoucare-react-verify), so the values are byte-faithful. The types here are
 * hand-written and deliberately permissive where the legacy shape is loose —
 * narrowing them is safe, inventing fields is not.
 *
 * Screens should import from this module rather than reaching into the JSON
 * files directly, so the shape is described in exactly one place.
 */
import patientsJson from './patients.json'
import trialsJson from './trials.json'
import survivorsJson from './survivors.json'
import parishesJson from './parishes.json'
import realJson from './real.json'
import teamJson from './team.json'
import cdsPanelJson from './cds_panel.json'
import referralsJson from './referrals.json'
import authCasesJson from './auth_cases.json'
import tbCasesJson from './tb_cases.json'
import slottimesJson from './slot_times.json'
import slotTypesJson from './slot_types.json'
import waitlistJson from './waitlist.json'
import sweepPopJson from './sweep_pop.json'
import replayJson from './replay.json'
import famStateJson from './fam_state.json'
import langToastJson from './lang_toast.json'
import phaseFmtJson from './phase_fmt.json'
import laMapJson from './la_map.json'

/* ------------------------------------------------------------------ patients */

/** Bundled demo charts used by Neon demo logins and clinician "view as". */
export type DemoPatientId = 'darlene' | 'priscilla' | 'yolanda' | 'marcus'

/**
 * Active chart id. `'self'` is a real Clerk (or other) account with a fresh
 * empty record — not one of the four demo patients.
 */
export type PatientId = DemoPatientId | 'self'

export interface CalendarType {
  ico: string
  label: string
  dur: number
  where: string
}

/** A family-circle task. `st` keys into FAM_STATE. */
export interface FamilyTask {
  t: string
  s: string
  st: string
}

/** done / in / open / auto — `c` is the extra class, `k` the check glyph. */
export interface FamilyState {
  c: string
  k: string
  d: string
}

export interface PlannedAppointment {
  off: number
  type: string
  time: string
  ride: boolean
  id: string
  date: Date
}

export interface CareTeamMember {
  name: string
  role: string
  [k: string]: unknown
}

export interface Patient {
  name: string
  age: number
  mrn: string
  city: string
  short: string
  chip: string
  profile: string
  dx: string
  grade: string
  subtype: string
  stage: string
  dxDate: string
  cycle: number
  cycleTotal: number
  cycleDay: number
  careTeam: CareTeamMember[]
  family: { sub: string; tasks: FamilyTask[] }
  surv: string | null
  trialSet: string[]
  vitals: Record<string, string | number>
  /** Check-in scores, oldest first. `cls` is the band, `v` the score out of 5. */
  trend: Array<{ v: number; label: string; cls: string }>
  calTypes: Record<string, CalendarType>
  calPlan: Array<{ off: number; type: string; time: string; ride: boolean }>
}

export const PATIENTS = patientsJson as unknown as Record<DemoPatientId, Patient>
export const PATIENT_IDS = Object.keys(PATIENTS) as DemoPatientId[]
export const DEMO_PATIENT_IDS = PATIENT_IDS

/* -------------------------------------------------------------------- trials */

export interface Trial {
  nct: string
  title: string
  status: string
  phase: string
  sites: string[]
  crits: Array<{ txt: string; ok: boolean | 'warn' }>
}

export const TRIALS = trialsJson as unknown as Trial[]
export const PHASE_FMT = phaseFmtJson as unknown as Record<string, string>

/* ----------------------------------------------------------------- survivors */

export interface Survivor {
  name: string
  age: number
  mrn: string
  parish: string
  dx: string
  dxDate: string
  endDate: string
  survivorSince: string
  treatments: Array<[string, string]>
  e: Record<string, number | boolean>
  /** Recorded "done" dates, keyed by rule category — these beat the projection. */
  od?: Record<string, string>
}

export const SURVIVORS = survivorsJson as unknown as Record<string, Survivor>
export const SURVIVOR_IDS = Object.keys(SURVIVORS)

/* ------------------------------------------------------------------ parishes */

export interface ParishTile {
  n: string
  ab: string
  x: number
  y: number
}

export interface ParishReal {
  pop: number
  inc: number
  late: number | null
  cov: number
}

export const PARISHES = parishesJson as unknown as ParishTile[]
export const PARISH_REAL = realJson as unknown as Record<string, ParishReal>
export const LA_MAP = laMapJson as unknown as { w: number; h: number; d: Record<string, string> }

/* ------------------------------------------------------------- clinic surfaces */

export const TEAM = teamJson as unknown as Array<{
  id: string
  name: string
  meta: string
  checkin: string
  days: number
  f: Record<string, number>
  driver: string
}>

export const CDS_PANEL = cdsPanelJson as unknown as Array<Record<string, unknown>>
export const REFERRALS = referralsJson as unknown as Array<Record<string, unknown>>
export const AUTH_CASES = authCasesJson as unknown as Record<string, Record<string, unknown>>
export const TB_CASES = tbCasesJson as unknown as Record<string, Record<string, unknown>>
export const WAITLIST = waitlistJson as unknown as Array<{ name: string; need: string }>
export const SLOT_TIMES = slottimesJson as unknown as string[]
export const SLOT_TYPES = slotTypesJson as unknown as Record<
  string,
  { w: number; dur: number; res: string }
>

/* ----------------------------------------------------------------- misc */

export const SWEEP_POP = sweepPopJson as unknown as Array<Record<string, unknown>>
export const REPLAY = replayJson as unknown as Array<[string, number, string, string]>
export const FAM_STATE = famStateJson as unknown as Record<string, FamilyState>
export const LANG_TOAST = langToastJson as unknown as Record<string, string>
