import { NavLink } from 'react-router-dom'
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

import { UnreadCount } from '@/components/shared/UnreadCount'
import { SPRING_THUMB } from '@/lib/ease'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { unreadTotal, useCareChat } from '@/store/careChat'
import { useActivePatient, usePatient } from '@/store/patient'

export interface PatientScreen {
  key: string
  icon: LucideIcon
  labelKey: string
}

/** The patient sub-screens, in the order the sidebar / menu lists them. */
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

function linkClass(isActive: boolean) {
  return cn(
    'relative isolate flex w-full items-center gap-2.5 rounded-full px-3 py-3 text-sm font-semibold transition-colors duration-200 ease-out motion-safe:active:scale-[0.99] lg:py-2',
    isActive
      ? 'text-on-dark'
      : 'text-foreground hover:bg-accent/70 hover:text-accent-foreground',
  )
}

function ScreenLink({
  screen,
  unread,
  layoutId,
}: {
  screen: PatientScreen
  unread: number
  layoutId: string
}) {
  const t = useT()
  const reduce = useReducedMotion()
  const Icon = screen.icon
  const showUnread = screen.key === 'messages' && unread > 0

  return (
    <NavLink
      to={`/my-care/${screen.key}`}
      className={({ isActive }) => linkClass(isActive)}
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
  const pid = usePatient((s) => s.pid)
  const patient = useActivePatient()
  const unreadMap = useCareChat((s) => s.unread)
  const messagesUnread = unreadTotal(unreadMap, pid, patient.careTeam)

  const firstName = patient.name.split(' ')[0] || patient.name
  const ageLabel = patient.age > 0 ? `, ${patient.age}` : ''

  /*
   * Profile card always. Section list is tablet+ only — on phones those
   * links live under Menu → My Care (see MobileNav). Sticky offsets track
   * the measured header heights.
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
              {firstName}{ageLabel}
            </b>
            <span className="block line-clamp-2 text-xs leading-snug text-muted-foreground">
              {patient.short}
            </span>
          </div>
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
