import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { TopBar } from '@/components/layout/TopBar'
import { RemiLauncher } from '@/components/ai/RemiLauncher'
import { PageFade } from '@/components/shared/Motion'

/**
 * The application chrome: fixed top bar, scrolling page body, footer.
 *
 * `<RemiLauncher />` is a global always-mounted element rather than part of the
 * Remi screen — the harness asserts on it across mode switches — and it sits
 * deliberately OUTSIDE the animated region below, so it holds still while a
 * screen fades in rather than blinking with every navigation.
 */
export function AppShell() {
  const { pathname } = useLocation()

  /*
   * Every route change starts at the top.
   *
   * These screens run long — Clinic Ops is several thousand pixels — and without
   * this the previous scroll offset carried over, so tapping "Appointments" from
   * the bottom of Home landed you midway down a screen you had not seen the top
   * of. `behavior: 'instant'` overrides the global `scroll-behavior: smooth`
   * deliberately: animating a 2,000px jump is a seasick way to arrive somewhere.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-background [background-image:radial-gradient(1200px_600px_at_50%_-10%,rgba(42,138,98,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_28%)] dark:[background-image:radial-gradient(1000px_500px_at_50%_-8%,rgba(61,154,111,0.14),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]">
      <TopBar />
      <main className="flex-1">
        {/*
          Keyed by pathname so the entrance replays per navigation. Framer
          Motion respects prefers-reduced-motion via PageFade → useReducedMotion.
        */}
        <PageFade key={pathname}>
          <Outlet />
        </PageFade>
      </main>
      <RemiLauncher />
      <footer className="border-t border-border px-3 py-4 text-center text-xs text-muted-foreground sm:px-6 sm:py-5">
        BayouCare · DevDays 2026
      </footer>
    </div>
  )
}
