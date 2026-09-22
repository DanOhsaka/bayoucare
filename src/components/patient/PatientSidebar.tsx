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
import { useUi } from '@/store/ui'
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

  /*
   * Caregiver mode: a family member is holding the device.
   *
   * It is still not an access control — the record on screen is the signed-in
   * account's, exactly as before — but it is no longer inert. It persists
   * across navigation now (it was a local `useState`, so it silently reset when
   * you left the sidebar), and the family circle on Home reads it to frame
   * itself for whoever is actually using the app.
   */
  const caregiver = useUi((s) => s.caregiver)
  const setCaregiver = useUi((s) => s.setCaregiver)

  const firstName = patient.name.split(' ')[0]

  /*
   * The sidebar becomes a column at `md`, not `lg` — it is the other half of
   * the pairing in `MyCare`, and neither half is correct alone.
   *
   * Between 768 and 1023 this was a horizontal strip: nine sections scrolling
   * sideways inside a card, above a screen that had a whole tablet's width to
   * show them in as a list. It read as an afterthought and it hid five of the
   * nine behind an unpainted scroll affordance, on the one form factor with
   * room for all nine at once.
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
          // Horizontal on a phone, where nine sections genuinely do not fit and
          // the strip is the right answer; a column from `md` up, where they do.
          className="mt-4 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
        >
          {PATIENT_SCREENS.map((s) => {
            const Icon = s.icon
            return (
              <NavLink
                key={s.key}
                to={`/my-care/${s.key}`}
                className={({ isActive }) =>
                  cn(
                    // py-2 is 36px; `py-3` is 44 below `lg` and `lg:py-2` returns
                    // the desktop rhythm. `md:w-full` so each section is a full
                    // row of the column rather than a label-sized pill.
                    'flex flex-none items-center gap-2.5 rounded-md px-3 py-3 text-sm font-semibold transition-colors md:w-full lg:py-2',
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
          {/*
              The visible box stays small — a 44px checkbox would be a cartoon —
              so the BOX is not the target. The `<label>` wraps the input, so
              the whole row is already clickable; it was just 20px tall, which
              is the thing that made this a 16x16 target in the measurement.
              `min-h-11` gives the row the full 44px of hit area, and the box
              itself goes to 20px so it is not dwarfed by it. Both restore at
              `lg`.
          */}
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-warning-fg lg:min-h-0">
            <input
              type="checkbox"
              checked={caregiver}
              onChange={(e) => setCaregiver(e.target.checked)}
              className="size-5 flex-none accent-[var(--warning)] lg:size-4"
            />
            {t('side.cgLabel')}
          </label>
          <p className="mt-1.5 text-xs text-warning-fg/90">
            {caregiver ? t('side.cgOn') : t('side.cgOff')}
          </p>
        </div>
      </div>
    </aside>
  )
}
