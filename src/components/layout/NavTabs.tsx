import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/navItems'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * Top-level navigation.
 *
 * Tabs are filtered by the current mode rather than hidden with CSS. The legacy
 * app kept all eight mounted and hid the other mode's with a specificity trick;
 * here the mode simply decides what is listed, which is the same user-visible
 * result without the CSS argument.
 *
 * The horizontal scroll on narrow screens is deliberate and matches the legacy
 * behaviour — a proper mobile drawer is a later refinement, not something to
 * rush into a shell that is still being assembled.
 */
export function NavTabs() {
  const t = useT()
  const mode = useUi((s) => s.mode)

  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    <nav aria-label="Main" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {visible.map((item) => (
        <NavLink
          key={item.view}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'whitespace-nowrap rounded-sm px-2.5 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-white/20 text-on-dark'
                : 'text-on-dark-muted hover:bg-white/10 hover:text-on-dark',
            )
          }
        >
          {t(item.key)}
        </NavLink>
      ))}
    </nav>
  )
}
