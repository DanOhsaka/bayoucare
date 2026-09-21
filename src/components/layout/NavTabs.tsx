import { Link, useLocation } from 'react-router-dom'
import { NAV_ITEMS, isNavItemActive } from '@/components/layout/navItems'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * Top-level navigation, from `md` up. Below `md` `MobileNav` renders the same
 * items as a dialog instead — this row is `hidden` there rather than scrolled.
 *
 * Tabs are filtered by the current mode rather than hidden with CSS. The legacy
 * app kept all eight mounted and hid the other mode's with a specificity trick;
 * here the mode simply decides what is listed, which is the same user-visible
 * result without the CSS argument.
 *
 * Three widths, each doing something different on purpose:
 *
 *  - **Below `md`** — not rendered; `MobileNav` owns the nav.
 *  - **`md` to `lg`** — its own full-width row under the chrome. The five admin
 *    tabs are ~470px and the rest of the header is ~660px, so a single row needs
 *    ~1141px: at 768px the old `flex-1` row was measured at 49px of client width
 *    and showed *none* of them, silently, behind a scrollbar most platforms never
 *    paint. On its own row all five fit from 768px up. The bar stays `order-last`
 *    and full width, so the brand, mode switch and controls keep row one to
 *    themselves — the shape the header already took at 320px.
 *  - **`lg` up** — unchanged from before this pass: inline, `flex-1`, scrollable.
 *    From 1024px there is room for the three patient tabs inline, and leaving the
 *    desktop header byte-identical is the point — see the note in the report
 *    about the admin set still clipping between 1024px and ~1181px.
 */
export function NavTabs() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const pathname = useLocation().pathname

  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    <nav
      aria-label="Main"
      className="order-last hidden w-full flex-none items-center gap-1 md:flex lg:order-none lg:w-auto lg:min-w-0 lg:flex-1 lg:overflow-x-auto"
    >
      {visible.map((item) => {
        const active = isNavItemActive(item, pathname)
        return (
          <Link
            key={item.view}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-sm px-2.5 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-white/20 text-on-dark'
                : 'text-on-dark-muted hover:bg-white/10 hover:text-on-dark',
            )}
          >
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
