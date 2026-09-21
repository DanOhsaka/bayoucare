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
 * True when `item` is the nav entry for `pathname`.
 *
 * Deliberately not `NavLink`'s own `isActive`, which compares the whole path:
 * `to: '/my-care/home'` stopped matching the moment a patient opened
 * `/my-care/calendar`, so the "My Care" tab went unmarked across eight of its
 * nine sub-screens. That is also why the drawer had no `aria-current` to
 * announce on those routes — and `aria-current` on the current item is the one
 * thing a nav sheet has to get right. Matching the item's first segment keeps
 * "My Care" current for the whole section and leaves the single-segment entries
 * (`/overview`, `/my-plan`, `/care-team` …) matching exactly as before.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.to) return true
  const section = `/${item.to.split('/').filter(Boolean)[0]}`
  return pathname === section || pathname.startsWith(`${section}/`)
}

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
