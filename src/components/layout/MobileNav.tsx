import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'

import { Drawer } from '@/components/motion/drawer'
import { NAV_ITEMS, isNavItemActive } from '@/components/layout/navItems'
import { PATIENT_SCREENS } from '@/components/patient/PatientSidebar'
import { UnreadCount } from '@/components/shared/UnreadCount'
import { PATIENTS } from '@/data'
import { useT } from '@/hooks/useT'
import { unreadTotal, useCareChat } from '@/store/careChat'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

const CONTROL =
  'flex h-11 flex-none items-center gap-2 rounded-full border border-border bg-background/70 px-2 text-xs font-medium text-foreground backdrop-blur-md lg:h-[34px]'

const NEW_KEYS: Record<string, string> = {
  'nav.menu': 'Menu',
  'nav.menuSub': 'Jump to a section',
  'nav.menuHint': 'Slides in from the left. Press Esc or click outside to close.',
}

/**
 * App menu — trigger sits left of the logo; full-height drawer opens from the left.
 * Patient "My Care" expands to the section list that used to live in the
 * horizontal ScrollRail on the profile card.
 */
export function MobileNav({ className }: { className?: string }) {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const pathname = useLocation().pathname
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const unreadMap = useCareChat((s) => s.unread)
  const messagesUnread = unreadTotal(unreadMap, pid, patient.careTeam)

  const [open, setOpen] = useState(false)
  const inMyCare = pathname.startsWith('/my-care')
  const [careOpen, setCareOpen] = useState(inMyCare)

  useEffect(() => {
    if (open && inMyCare) setCareOpen(true)
  }, [open, inMyCare])

  const label = (key: string) => {
    const s = t(key)
    return s === key ? (NEW_KEYS[key] ?? key) : s
  }

  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    <>
      <button
        type="button"
        aria-label={label('nav.menu')}
        title={label('nav.menu')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(CONTROL, 'w-11 justify-center md:hidden lg:w-[34px]', className)}
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        side="left"
        ariaLabel={label('nav.menu')}
        className="bg-card"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="min-w-0 pt-1">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {label('nav.menu')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{label('nav.menuSub')}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
              {label('nav.menuHint')}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className={cn(CONTROL, 'mt-0.5 w-11 shrink-0 justify-center')}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Main"
          className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {visible.map((item) => {
            const active = isNavItemActive(item, pathname)

            if (item.view === 'app') {
              return (
                <div key={item.view} className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-expanded={careOpen}
                    aria-controls="menu-my-care-sections"
                    onClick={() => setCareOpen((v) => !v)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-left text-base font-semibold transition-colors',
                      active || careOpen
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <span>{t(item.key)}</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 transition-transform duration-200',
                        careOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {careOpen ? (
                    <div
                      id="menu-my-care-sections"
                      role="group"
                      aria-label={t(item.key)}
                      className="ml-2 flex flex-col gap-0.5 border-l border-border py-1 pl-2"
                    >
                      {PATIENT_SCREENS.map((screen) => {
                        const to = `/my-care/${screen.key}`
                        const sectionActive =
                          pathname === to || pathname.startsWith(`${to}/`)
                        const Icon = screen.icon
                        const showUnread = screen.key === 'messages' && messagesUnread > 0
                        return (
                          <Link
                            key={screen.key}
                            to={to}
                            aria-current={sectionActive ? 'page' : undefined}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                              sectionActive
                                ? 'bg-brand-700 text-on-dark'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                          >
                            <Icon className="size-4 flex-none" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{t(screen.labelKey)}</span>
                            {showUnread ? (
                              <UnreadCount
                                count={messagesUnread}
                                tone={sectionActive ? 'onDark' : 'danger'}
                              />
                            ) : null}
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            }

            return (
              <Link
                key={item.view}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-2xl px-4 py-3.5 text-base font-semibold transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {t(item.key)}
              </Link>
            )
          })}
        </nav>
      </Drawer>
    </>
  )
}
