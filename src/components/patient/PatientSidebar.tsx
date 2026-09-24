import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  Calendar,
  Car,
  Compass,
  House,
  Map,
  MessageCircle,
  Pencil,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { ProfileEditDialog } from '@/components/patient/ProfileEditDialog'
import { UnreadCount } from '@/components/shared/UnreadCount'
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
    'flex w-full min-w-0 items-center gap-2.5 rounded-full px-3 py-3 text-sm font-semibold transition-colors duration-150 ease-out motion-safe:active:scale-[0.99] lg:py-2',
    isActive
      ? 'bg-brand-700 text-on-dark'
      : 'text-foreground hover:bg-accent/70 hover:text-accent-foreground',
  )
}

function ScreenLink({
  screen,
  unread,
}: {
  screen: PatientScreen
  unread: number
}) {
  const t = useT()
  const Icon = screen.icon
  const showUnread = screen.key === 'messages' && unread > 0

  return (
    <NavLink
      to={`/my-care/${screen.key}`}
      className={({ isActive }) => linkClass(isActive)}
    >
      {({ isActive }) => (
        <>
          <Icon className="size-4 flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{t(screen.labelKey)}</span>
          {showUnread ? (
            <UnreadCount
              count={unread}
              tone={isActive ? 'onDark' : 'danger'}
              className="flex-none"
            />
          ) : null}
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
  const [editOpen, setEditOpen] = useState(false)

  const firstName = patient.name.split(' ')[0] || patient.name
  const ageLabel = patient.age > 0 ? `, ${patient.age}` : ''

  return (
    <aside className="min-w-0 md:sticky md:top-[112px] md:self-start lg:top-[60px]">
      <div className="overflow-hidden rounded-lg border border-border bg-card p-3 shadow-[var(--shadow)] sm:p-4">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Edit profile"
          className="group flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-700 text-base font-bold text-on-dark">
            {firstName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-sm font-semibold text-card-foreground">
              {firstName}
              {ageLabel}
            </b>
            <span className="block line-clamp-2 text-xs leading-snug text-muted-foreground">
              {patient.short}
            </span>
          </div>
          <Pencil
            className="size-3.5 flex-none text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </button>

        <nav
          aria-label="My Care sections"
          className="mt-4 hidden max-h-[min(70dvh,calc(100dvh-10rem))] flex-col gap-1 overflow-x-hidden overflow-y-auto overscroll-contain scrollbar-hide md:flex"
        >
          {PATIENT_SCREENS.map((s) => (
            <ScreenLink key={s.key} screen={s} unread={messagesUnread} />
          ))}
        </nav>
      </div>

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
    </aside>
  )
}
