import { NavLink } from 'react-router-dom'
import {
  Activity,
  Calendar,
  Car,
  Compass,
  House,
  Leaf,
  Map,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { usePatient } from '@/store/patient'
import { PATIENTS } from '@/data'
import { unreadTotal, useCareChat } from '@/store/careChat'
import { UnreadCount } from '@/components/shared/UnreadCount'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

export interface PatientScreen {
  key: string
  icon: LucideIcon
  labelKey: string
}

/** The patient sub-screens, in the order the sidebar lists them. */
export const PATIENT_SCREENS: PatientScreen[] = [
  { key: 'home', icon: House, labelKey: 'side.home' },
  { key: 'family', icon: Users, labelKey: 'side.family' },
  { key: 'calendar', icon: Calendar, labelKey: 'side.calendar' },
  { key: 'prevent', icon: ShieldCheck, labelKey: 'side.prevent' },
  { key: 'journey', icon: Map, labelKey: 'side.journey' },
  { key: 'understand', icon: Compass, labelKey: 'side.understand' },
  { key: 'checkins', icon: TrendingUp, labelKey: 'side.checkins' },
  { key: 'vitals', icon: Activity, labelKey: 'side.vitals' },
  { key: 'access', icon: Car, labelKey: 'side.access' },
  { key: 'messages', icon: MessageCircle, labelKey: 'side.messages' },
  { key: 'remi', icon: Leaf, labelKey: 'side.remi' },
]

export function PatientSidebar() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const unreadMap = useCareChat((s) => s.unread)
  const messagesUnread = unreadTotal(unreadMap, pid, patient.careTeam)

  const firstName = patient.name.split(' ')[0]

  /*
   * The sidebar becomes a column at `md`, not `lg` — it is the other half of
   * the pairing in `MyCare`, and neither half is correct alone.
   *
   * Between 768 and 1023 this was a horizontal strip: sections scrolling
   * sideways inside a card, above a screen that had a whole tablet's width to
   * show them in as a list. It read as an afterthought and it hid several
   * behind an unpainted scroll affordance, on the one form factor with room
   * for them at once.
   *
   * The offset is restated at `lg` because the header changes height at that
   * breakpoint: below `lg` the tab row is on its own line and the controls are
   * 44px, from `lg` they are inline and 34px. Both numbers are measured, not
   * derived — see the report; a hardcoded offset that drifts from the real
   * header height leaves a band of live content above the pinned sidebar.
   */
  return (
    <aside className="md:sticky md:top-[112px] md:self-start lg:top-[60px]">
      <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow)]">
        {/* Identity. The record this is bound to is the same one every other
            patient screen reads — there is no second source of truth. */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-700 text-base font-bold text-on-dark">
            {firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <b className="block text-sm font-semibold text-card-foreground">
              {firstName}, {patient.age}
            </b>
            <span className="block text-xs leading-snug text-muted-foreground">{patient.short}</span>
          </div>
        </div>

        <nav
          aria-label="My Care sections"
          className="mt-4 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
        >
          {PATIENT_SCREENS.map((s) => {
            const Icon = s.icon
            const showUnread = s.key === 'messages' && messagesUnread > 0
            return (
              <NavLink
                key={s.key}
                to={`/my-care/${s.key}`}
                className={({ isActive }) =>
                  cn(
                    'flex flex-none items-center gap-2.5 rounded-md px-3 py-3 text-sm font-semibold transition-[color,background-color,transform] duration-200 ease-out md:w-full lg:py-2 motion-safe:active:scale-[0.99]',
                    isActive
                      ? 'bg-brand-700 text-on-dark shadow-[var(--shadow-sm)]'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="size-4 flex-none" aria-hidden="true" />
                    <span className="min-w-0 flex-1 whitespace-nowrap">{t(s.labelKey)}</span>
                    {showUnread && (
                      <UnreadCount count={messagesUnread} tone={isActive ? 'onDark' : 'danger'} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
