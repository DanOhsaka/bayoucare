import type { Mode } from '@/store/ui'

/**
 * The eight top-level views.
 *
 * `mode` is presentation metadata, matching the legacy `data-mode` attribute on
 * each nav button — it decides which tabs are visible, and nothing else. No
 * data-layer value may read it.
 */
export interface NavItem {
  view: string
  key: string
  mode: Mode
  to: string
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'overview', key: 'nav.overview', mode: 'patient', to: '/overview' },
  { view: 'app', key: 'nav.app', mode: 'patient', to: '/my-care/home' },
  { view: 'myplan', key: 'nav.myplan', mode: 'patient', to: '/my-plan' },
  { view: 'team', key: 'nav.team', mode: 'admin', to: '/care-team' },
  { view: 'clinicops', key: 'nav.clinicops', mode: 'admin', to: '/clinic-ops' },
  { view: 'survivorship', key: 'nav.surv', mode: 'admin', to: '/survivorship' },
  { view: 'population', key: 'nav.pop', mode: 'admin', to: '/population' },
  { view: 'roadmap', key: 'nav.roadmap', mode: 'admin', to: '/roadmap' },
]

/**
 * The nine patient sub-screens inside "My Care".
 *
 * Every one is rendered by the same route and selected by URL, so switching
 * between them keeps browser history and survives a refresh — neither of which
 * the legacy class-toggling did.
 */
export const SCREENS = [
  'home',
  'calendar',
  'prevent',
  'journey',
  'understand',
  'checkins',
  'vitals',
  'access',
  'remi',
] as const

export type Screen = (typeof SCREENS)[number]

export function isScreen(v: string | undefined): v is Screen {
  return !!v && (SCREENS as readonly string[]).includes(v)
}
