import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  Calendar,
  Car,
  Compass,
  House,
  Leaf,
  Map,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import { usePatient } from '@/store/patient'
import { PATIENTS } from '@/data'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

export interface PatientScreen {
  key: string
  icon: LucideIcon
  labelKey: string
}

/** The nine patient sub-screens, in the order the sidebar lists them. */
export const PATIENT_SCREENS: PatientScreen[] = [
  { key: 'home', icon: House, labelKey: 'side.home' },
  { key: 'calendar', icon: Calendar, labelKey: 'side.calendar' },
  { key: 'prevent', icon: ShieldCheck, labelKey: 'side.prevent' },
  { key: 'journey', icon: Map, labelKey: 'side.journey' },
  { key: 'understand', icon: Compass, labelKey: 'side.understand' },
  { key: 'checkins', icon: TrendingUp, labelKey: 'side.checkins' },
  { key: 'vitals', icon: Activity, labelKey: 'side.vitals' },
  { key: 'access', icon: Car, labelKey: 'side.access' },
  { key: 'remi', icon: Leaf, labelKey: 'side.remi' },
]

export function PatientSidebar() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]

  // Presentation only, exactly as in the legacy app: this changes the note and
  // nothing else. It is not an access control and never was.
  const [caregiver, setCaregiver] = useState(false)

  const firstName = patient.name.split(' ')[0]

  return (
    <aside className="lg:sticky lg:top-[76px] lg:self-start">
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

        <nav aria-label="My Care sections" className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {PATIENT_SCREENS.map((s) => {
            const Icon = s.icon
            return (
              <NavLink
                key={s.key}
                to={`/my-care/${s.key}`}
                className={({ isActive }) =>
                  cn(
                    'flex flex-none items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors lg:w-full',
                    isActive
                      ? 'bg-brand-700 text-on-dark'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="size-4 flex-none" aria-hidden="true" />
                <span className="whitespace-nowrap">{t(s.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-4 rounded-md border border-warning/30 bg-warning-bg p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-warning-fg">
            <input
              type="checkbox"
              checked={caregiver}
              onChange={(e) => setCaregiver(e.target.checked)}
              className="size-4 flex-none accent-[var(--warning)]"
            />
            {t('side.cgLabel')}
          </label>
          <p className="mt-1.5 text-xs text-warning-fg/90">
            {caregiver ? 'On — someone else is following along' : 'Off — viewing as patient'}
          </p>
        </div>
      </div>
    </aside>
  )
}
