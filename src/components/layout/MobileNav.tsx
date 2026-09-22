import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NAV_ITEMS, isNavItemActive } from '@/components/layout/navItems'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/*
 * Mirrors `TopBar`'s `CONTROL`, deliberately: same geometry, same 44px below
 * `lg` and same designed 34px above it. These two strings are a pair and have
 * to move together — this one is the app's entire navigation on a phone, so it
 * was the single most important control in the audit to get right, and it is
 * the one that was missed first time precisely because the string is a copy.
 *
 * It is a plain `<button>` rather than the `Button` primitive for the same
 * reason the TopBar controls are: `Button`'s variants are styled for light
 * surfaces, and the chrome is dark in BOTH themes. Nothing here suppresses the
 * outline, so this control focuses on the global `:focus-visible` ring exactly
 * like its neighbours.
 */
const CONTROL =
  'flex h-11 flex-none items-center gap-2 rounded-sm border border-white/25 bg-white/10 px-2 text-xs font-semibold text-on-dark transition-colors duration-200 ease-out hover:bg-white/20 lg:h-[34px]'

/** New in this pass — see the handover note. English until the dictionary has them. */
const NEW_KEYS: Record<string, string> = {
  'nav.menu': 'Menu',
  'nav.menuSub': 'Jump to a section',
}

/**
 * Top-level navigation below `md`, as a dialog rather than the horizontal
 * scroller it replaces.
 *
 * The scroller was never actually reachable: measured, the admin tab row is
 * 470px of content inside a `flex-1` box that a tablet gave 49px, so at 768px
 * *none* of the five tabs were on screen and at 320px two were — behind a scroll
 * affordance most platforms never paint. The tabs are the app's only route
 * between modes, so hiding them is hiding the app.
 *
 * Radix supplies the behaviour that is easy to get wrong by hand — focus trap,
 * Escape, focus restore to the trigger, scroll lock, `aria-modal` — and
 * `dialog.tsx` already carries that wiring, so this file is layout and semantics
 * only.
 */
export function MobileNav() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const pathname = useLocation().pathname

  const [open, setOpen] = useState(false)

  /*
   * `translate()` falls back to the key itself when a string is missing, which
   * would print the literal `nav.menu` on the trigger. These two keys are new
   * here and are handed over for the dictionary owner to land; until then, fall
   * back to the same English the dictionary would have supplied.
   */
  const label = (key: string) => {
    const s = t(key)
    return s === key ? (NEW_KEYS[key] ?? key) : s
  }

  // Same source as the tab row: the mode decides what is listed, and CSS decides
  // which of the two navs is on screen. No second copy of the nav data.
  const visible = NAV_ITEMS.filter((i) => i.mode === mode)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={label('nav.menu')}
          title={label('nav.menu')}
          className={cn(CONTROL, 'w-11 justify-center md:hidden lg:w-[34px]')}
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{label('nav.menu')}</DialogTitle>
          <DialogDescription>{label('nav.menuSub')}</DialogDescription>
        </DialogHeader>

        {/*
         * `aria-label="Main"` matches the tab row. Only one of the two is ever
         * displayed, and `display:none` keeps the hidden one out of the
         * accessibility tree, so a screen reader never meets both.
         */}
        <nav aria-label="Main" className="flex flex-col gap-1">
          {visible.map((item) => {
            const active = isNavItemActive(item, pathname)
            return (
              <Link
                key={item.view}
                to={item.to}
                // Naming the current route is the point of the sheet. This and
                // the tab row's `aria-current` come from one helper, so the two
                // navs cannot disagree about where you are.
                aria-current={active ? 'page' : undefined}
                // Controlled close rather than Radix's `DialogClose`: the link
                // has to both navigate and dismiss, and routing is React
                // Router's job, not the dialog's.
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-brand-700 text-on-dark'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {t(item.key)}
              </Link>
            )
          })}
        </nav>
      </DialogContent>
    </Dialog>
  )
}
