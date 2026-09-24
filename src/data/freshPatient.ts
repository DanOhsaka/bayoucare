import type { Patient } from '@/data'

/** Shared appointment types so a fresh account can still book visits. */
export const FRESH_CAL_TYPES: Patient['calTypes'] = {
  labs: {
    ico: '',
    label: 'Blood draw',
    dur: 30,
    where: 'Local lab',
  },
  infusion: {
    ico: '',
    label: 'Infusion',
    dur: 120,
    where: 'Infusion suite',
  },
  imaging: {
    ico: '',
    label: 'CT / imaging',
    dur: 60,
    where: 'Imaging center',
  },
  followup: {
    ico: '',
    label: 'Oncology follow-up',
    dur: 30,
    where: 'Clinic exam room',
  },
  consult: {
    ico: '',
    label: 'Care consult',
    dur: 45,
    where: 'Care navigation',
  },
}

export interface FreshPatientOptions {
  name: string
  age?: number
  city?: string
}

/**
 * Empty chart for a real signed-in account — no demo appointments, diagnosis,
 * or family tasks. My Plan fills the clinical fields after sign-in.
 */
export function createFreshPatient({
  name,
  age = 0,
  city = '',
}: FreshPatientOptions): Patient {
  const display = name.trim() || 'Friend'
  const first = display.split(/\s+/)[0] ?? display

  return {
    name: display,
    age,
    mrn: '—',
    city,
    short: city ? `${city}, LA · Profile incomplete` : 'Complete your health profile',
    chip: 'Getting started',
    profile: `${display} · new BayouCare account`,
    dx: '',
    grade: '',
    subtype: '',
    stage: '',
    dxDate: '',
    cycle: 0,
    cycleTotal: 0,
    cycleDay: 0,
    careTeam: [
      {
        name: 'BayouCare Navigator',
        role: 'Patient Navigator',
        note: 'Here when you are ready',
      },
    ],
    family: {
      sub: `${first}, invite family when you are ready — they can help with rides and reminders.`,
      tasks: [],
    },
    surv: null,
    // Empty string is falsy — Access treats that as "trials N/A" (demo JSON uses a set key).
    trialSet: '' as unknown as string[],
    vitals: {
      temp: '—',
      tr: '—',
      w: '—',
      wd: '—',
      flag: '—',
      flagCls: 'ok',
    },
    trend: [
      { v: 0, label: 'Sun', cls: 'lo' },
      { v: 0, label: 'Mon', cls: 'lo' },
      { v: 0, label: 'Tue', cls: 'lo' },
      { v: 0, label: 'Wed', cls: 'lo' },
      { v: 0, label: 'Thu', cls: 'lo' },
    ],
    calTypes: FRESH_CAL_TYPES,
    calPlan: [],
  }
}

export function isProfileComplete(p: Patient): boolean {
  return Boolean(p.dx.trim() && p.stage.trim())
}

export function deriveChip(p: Patient): string {
  if (!isProfileComplete(p)) return 'Getting started'
  if (p.cycleTotal > 0 && p.cycleDay > 0) {
    return `Day ${p.cycleDay} of ${p.cycleTotal} · Cycle ${p.cycle || 1}`
  }
  if (p.surv) return 'Survivorship'
  return 'Care plan ready'
}

export function deriveShort(p: Patient): string {
  if (!isProfileComplete(p)) {
    return p.city ? `${p.city}, LA · Profile incomplete` : 'Complete your health profile'
  }
  const place = p.city ? `${p.city}, LA` : 'Louisiana'
  return `${place} · ${p.stage}`
}

export function deriveProfile(p: Patient): string {
  const bits = [p.name]
  if (p.age > 0) bits[0] = `${p.name}, ${p.age}`
  if (p.stage) bits.push(p.stage)
  if (p.subtype) bits.push(p.subtype)
  if (p.city) bits.push(p.city + ', LA')
  return bits.join(' · ')
}
