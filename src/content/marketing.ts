/** Shared marketing copy blocks used by the public landing and in-app Home. */

import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  ChartColumn,
  Compass,
  Handshake,
  Languages,
  Map,
  Shield,
  TrendingUp,
  Car,
  Users,
  Wifi,
} from 'lucide-react'

export const MARKETING_STATS = [
  { n: '29,980', small: '/yr', key: 'hero.s1' },
  { n: '165.2', small: 'vs 146.0', key: 'hero.s2' },
  { n: '64', small: 'parishes', key: 'hero.s3' },
  { n: 'You', small: '+ your family', key: 'hero.s4' },
] as const

export const MARKETING_WHY = [
  {
    tag: 'coral',
    tagLabel: 'The problem',
    h: 'We find cancer late',
    p: 'Incidence and mortality both run above the national average — and rural patients navigate a fragmented system alone: a diagnosis with no roadmap, no support.',
  },
  {
    tag: 'amber',
    tagLabel: 'The gap',
    h: "Navigation tools don't exist here",
    p: 'National apps assume broadband and nearby specialists. In Louisiana, care can be hours away and families shoulder logistics alone.',
  },
  {
    tag: 'green',
    tagLabel: 'The opportunity',
    h: 'Technology Louisiana trusts',
    p: 'Plain language, phone-first, plans the miles, connects family and clinicians — built with Louisiana, not adapted from elsewhere.',
  },
] as const

export const MARKETING_JOURNEY = [
  ['0 · Prevent', 'Screen & catch early'],
  ['1 · Diagnosis', 'Understand the report'],
  ['2 · Plan', 'Personalized roadmap'],
  ['3 · Treatment', 'Check-ins & coordination'],
  ['4 · Survivorship', 'SCP plan + late-effects radar'],
  ['5 · Supportive care', 'Resources & community'],
] as const

export type MarketingItem = {
  icon: LucideIcon
  h: string
  p: string
}

export const MARKETING_TOOLS: MarketingItem[] = [
  {
    icon: Compass,
    h: 'Understand — AI diagnosis explainer',
    p: 'Turns pathology reports into plain English, plus questions to ask your doctor.',
  },
  {
    icon: Map,
    h: 'My Journey — a real roadmap',
    p: 'A living checklist of every step, shared with family.',
  },
  {
    icon: TrendingUp,
    h: 'Check-ins — earlier intervention',
    p: 'Daily symptom check-ins that alert the care team before things escalate.',
  },
  {
    icon: Car,
    h: 'Access — care you can reach',
    p: 'Rides, telehealth, financial help, and resources — rural-first.',
  },
  {
    icon: Users,
    h: 'Family help hub',
    p: 'Shared tasks, the next visit, and a way to message the care team — same record, clear jobs for helpers.',
  },
  {
    icon: CalendarDays,
    h: 'Appointments & calendar',
    p: 'Every visit, infusion and scan in one place — with reminders and a ride when you need one.',
  },
  {
    icon: Shield,
    h: 'Screen & Prevent — catch it early',
    p: 'Screening reminders based on your own risk, not a generic schedule.',
  },
  {
    icon: ChartColumn,
    h: 'ASCO-informed guidance',
    p: 'Guidelines and education built on the official data partner.',
  },
]

export const MARKETING_WINS: MarketingItem[] = [
  {
    icon: Wifi,
    h: 'Built for low bandwidth',
    p: 'Lean load, low-bandwidth telehealth mode, and SMS-style caregiver alerts in the demo.',
  },
  {
    icon: Languages,
    h: 'Four languages on the patient journey',
    p: 'English, Spanish, Haitian Creole, and Vietnamese — not a separate translation page.',
  },
  {
    icon: Handshake,
    h: 'Family-inclusive',
    p: 'Helpers pick up rides, tasks, and messages — without a second login.',
  },
]

export const TAG_BADGE: Record<string, 'danger' | 'warning' | 'success'> = {
  coral: 'danger',
  amber: 'warning',
  green: 'success',
}
