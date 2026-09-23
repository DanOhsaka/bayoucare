import { Link, useLocation } from 'react-router-dom'
import { LayoutGroup, motion, MotionConfig, useReducedMotion } from 'motion/react'

import { NAV_ITEMS, isNavItemActive } from '@/components/layout/navItems'
import { SPRING_THUMB } from '@/lib/ease'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * Top-level navigation, from `md` up. Below `md` `MobileNav` renders the same
 * items as a dialog instead — this row is `hidden` there rather than scrolled.
 *
 * Active pill uses the same spring as the theme switch so tab changes feel like
 * the light/dark thumb sliding.
 */
export function NavTabs() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const pathname = useLocation().pathname
  const reduce = useReducedMotion()

  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : SPRING_THUMB}>
      <LayoutGroup id={`nav-tabs-${mode}`}>
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
                  'relative whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:active:scale-[0.96] lg:py-1.5',
                  active
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId={`nav-tabs-pill-${mode}`}
                    className="absolute inset-0 z-0 rounded-full bg-primary shadow-[var(--shadow-sm)]"
                    transition={reduce ? { duration: 0 } : SPRING_THUMB}
                  />
                ) : null}
                <span className="relative z-10">{t(item.key)}</span>
              </Link>
            )
          })}
        </nav>
      </LayoutGroup>
    </MotionConfig>
  )
}
