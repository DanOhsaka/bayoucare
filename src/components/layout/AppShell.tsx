import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { TopBar } from '@/components/layout/TopBar'
import { RemiLauncher } from '@/components/ai/RemiLauncher'
import { PageFade } from '@/components/shared/Motion'
import { TracingBeam } from '@/components/ui/tracing-beam'

/**
 * Stable key for top-level chrome transitions.
 *
 * My Care keeps one shell (sidebar + content); section changes animate inside
 * `MyCare` so the sidebar and header do not remount / reflow on every click.
 */
function pageTransitionKey(pathname: string) {
  if (pathname.startsWith('/my-care')) return '/my-care'
  return pathname
}

/**
 * The application chrome: fixed top bar, scrolling page body.
 *
 * `<RemiLauncher />` is a global always-mounted element rather than part of the
 * Remi screen — the harness asserts on it across mode switches — and it sits
 * deliberately OUTSIDE the animated region below, so it holds still while a
 * screen fades in rather than blinking with every navigation.
 *
 * Tracing beam shows on tablet/desktop when a route is taller than the viewport;
 * phone layouts skip it entirely. Route scroll reset lives in `<ScrollToTop />`.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const pageKey = pageTransitionKey(pathname)

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background [background-image:radial-gradient(1200px_600px_at_50%_-10%,rgba(42,138,98,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_28%)] dark:[background-image:radial-gradient(1000px_500px_at_50%_-8%,rgba(61,154,111,0.14),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]">
      <TopBar />
      <main className="min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageFade key={pageKey} className="min-w-0">
            <TracingBeam className="max-w-none">
              <Outlet />
            </TracingBeam>
          </PageFade>
        </AnimatePresence>
      </main>
      <RemiLauncher />
    </div>
  )
}
