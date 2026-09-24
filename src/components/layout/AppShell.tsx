import { Outlet } from 'react-router-dom'

import { TopBar } from '@/components/layout/TopBar'
import { RemiLauncher } from '@/components/ai/RemiLauncher'
import { RouteEnter } from '@/components/layout/RouteEnter'
import { TracingBeam } from '@/components/ui/tracing-beam'

/**
 * Persistent application chrome.
 *
 * Header, background, and Remi stay mounted across navigations. Only the
 * `<Outlet />` content swaps — no AnimatePresence "wait" blank frame.
 *
 * My Care uses a nested layout route so its sidebar also stays mounted while
 * sections change (see `MyCare` + `/my-care/*` child routes).
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background [background-image:radial-gradient(1200px_600px_at_50%_-10%,rgba(42,138,98,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_28%)] dark:[background-image:radial-gradient(1000px_500px_at_50%_-8%,rgba(61,154,111,0.14),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]">
      <TopBar />
      <main className="min-w-0 flex-1" id="app-main">
        <TracingBeam className="max-w-none">
          <RouteEnter stabilizeMyCare>
            <Outlet />
          </RouteEnter>
        </TracingBeam>
      </main>
      <RemiLauncher />
    </div>
  )
}
