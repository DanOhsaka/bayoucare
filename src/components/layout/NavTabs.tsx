import { Link, useLocation } from 'react-router-dom'

import { NAV_ITEMS, isNavItemActive } from '@/components/layout/navItems'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * Top-level navigation, from `md` up. Below `md` `MobileNav` renders the same
 * items as a dialog instead — this row is `hidden` there rather than scrolled.
 *
 * Active fill is static (no shared-layout pill) so the label and background
 * appear together — a sliding pill left "My Care" dark-on-dark mid-transition.
 */
export function NavTabs() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const pathname = useLocation().pathname

  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    <nav
      aria-label="Main"
      className="order-last hidden w-full min-w-0 flex-none items-center gap-1 overflow-x-auto bc-nav-scroll md:flex lg:order-none lg:w-auto lg:flex-1"
    >
      {visible.map((item) => {
        const active = isNavItemActive(item, pathname)
        return (
          <Link
            key={item.view}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:active:scale-[0.96] lg:py-1.5',
              active
                ? 'bg-primary text-primary-foreground shadow-[var(--shadow-sm)]'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
