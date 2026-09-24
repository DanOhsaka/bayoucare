import { Outlet } from 'react-router-dom'

import { PatientSidebar } from '@/components/patient/PatientSidebar'
import { RouteEnter } from '@/components/layout/RouteEnter'

/**
 * Persistent My Care layout: sidebar + content outlet.
 *
 * Section screens are nested routes (`/my-care/home`, …) so this shell — and
 * the global AppShell above it — never remount when switching tabs.
 */
export function MyCare() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:grid md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:items-start md:gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
      <PatientSidebar />
      <div
        className="relative mt-3 min-h-[min(70dvh,36rem)] min-w-0 md:mt-0"
        aria-live="polite"
      >
        <RouteEnter>
          <Outlet />
        </RouteEnter>
      </div>
    </div>
  )
}
