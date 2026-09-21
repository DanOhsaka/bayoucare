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
 * behaviour. A drawer that lists the tabs with room for labels would still be
 * better on a phone; this keeps them reachable, which is the part that was
 * actually broken.
 */
export function NavTabs() {
  const t = useT()
  const mode = useUi((s) => s.mode)

  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    /*
     * Below `sm` the tabs take their own full-width row instead of sharing one
     * with the chrome. Sharing made them the only shrinkable child in the
     * header, so they collapsed to zero width — the tabs became unreachable
     * while the header still overflowed the viewport. The row still scrolls:
     * five admin tabs do not fit at 320px, and scrolling them is intended.
     */
    <nav
      aria-label="Main"
      className="order-last flex w-full min-w-0 items-center gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
    >
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
