import { useLocation, NavLink } from 'react-router-dom'
import { LayoutGroup, motion, MotionConfig, useReducedMotion } from 'motion/react'
import {
  Activity,
  Calendar,
  Car,
  Compass,
  House,
  Map,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { ScrollRail } from '@/components/shared/ScrollRail'
import { UnreadCount } from '@/components/shared/UnreadCount'
import { PATIENTS } from '@/data'
import { SPRING_THUMB } from '@/lib/ease'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { unreadTotal, useCareChat } from '@/store/careChat'
import { usePatient } from '@/store/patient'

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
]

function linkClass(isActive: boolean, rail: boolean) {
  return cn(
    'relative isolate flex items-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200 ease-out motion-safe:active:scale-[0.99]',
    rail
      ? 'snap-start flex-none px-3 py-2.5'
      : 'w-full gap-2.5 px-3 py-3 lg:py-2',
    isActive
      ? 'text-on-dark'
      : 'text-foreground hover:bg-accent/70 hover:text-accent-foreground',
  )
}

function ScreenLink({
  screen,
  unread,
  rail,
  layoutId,
}: {
  screen: PatientScreen
  unread: number
  rail?: boolean
  layoutId: string
}) {
  const t = useT()
  const reduce = useReducedMotion()
  const Icon = screen.icon
  const showUnread = screen.key === 'messages' && unread > 0

  return (
    <NavLink
      to={`/my-care/${screen.key}`}
      className={({ isActive }) => linkClass(isActive, !!rail)}
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 z-0 rounded-full bg-brand-700 shadow-[var(--shadow-sm)]"
              transition={reduce ? { duration: 0 } : SPRING_THUMB}
            />
          ) : null}
          <Icon className="relative z-[1] size-4 flex-none" aria-hidden="true" />
          <span className="relative z-[1] min-w-0 whitespace-nowrap">{t(screen.labelKey)}</span>
          {showUnread && (
            <UnreadCount
              count={unread}
              tone={isActive ? 'onDark' : 'danger'}
              className="relative z-[1]"
            />
          )}
        </>
      )}
    </NavLink>
  )
}

export function PatientSidebar() {
  const location = useLocation()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const unreadMap = useCareChat((s) => s.unread)
  const messagesUnread = unreadTotal(unreadMap, pid, patient.careTeam)

  const firstName = patient.name.split(' ')[0]

  /*
   * The sidebar becomes a column at `md`, not `lg` — it is the other half of
   * the pairing in `MyCare`, and neither half is correct alone.
   *
   * Below `md` the eleven sections ride a ScrollRail (chevrons + edge fades)
   * instead of a native overflow scrollbar. The sticky offsets at `md`/`lg`
   * track the measured header heights — see the layout report.
   */
  return (
    <aside className="min-w-0 md:sticky md:top-[112px] md:self-start lg:top-[60px]">
      <div className="rounded-lg border border-border bg-card p-3 shadow-[var(--shadow)] sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-700 text-base font-bold text-on-dark">
            {firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <b className="block truncate text-sm font-semibold text-card-foreground">
              {firstName}, {patient.age}
            </b>
            <span className="block line-clamp-2 text-xs leading-snug text-muted-foreground">
              {patient.short}
            </span>
          </div>
        </div>

        {/* Narrow: scroll rail. Tablet+ : vertical list. */}
        <div className="mt-3 md:hidden">
          <MotionConfig transition={SPRING_THUMB}>
            <LayoutGroup id="patient-rail">
              <ScrollRail aria-label="My Care sections" activeKey={location.pathname}>
                {PATIENT_SCREENS.map((s) => (
                  <ScreenLink
                    key={s.key}
                    screen={s}
                    unread={messagesUnread}
                    rail
                    layoutId="patient-care-rail-pill"
                  />
                ))}
              </ScrollRail>
            </LayoutGroup>
          </MotionConfig>
        </div>

        <MotionConfig transition={SPRING_THUMB}>
          <LayoutGroup id="patient-nav">
            <nav
              aria-label="My Care sections"
              className="mt-4 hidden max-h-[min(70dvh,calc(100dvh-10rem))] flex-col gap-1 overflow-y-auto overscroll-contain md:flex"
            >
              {PATIENT_SCREENS.map((s) => (
                <ScreenLink
                  key={s.key}
                  screen={s}
                  unread={messagesUnread}
                  layoutId="patient-care-nav-pill"
                />
              ))}
            </nav>
          </LayoutGroup>
        </MotionConfig>
      </div>
    </aside>
  )
}
