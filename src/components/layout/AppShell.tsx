import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { RemiLauncher } from '@/components/ai/RemiLauncher'

/**
 * The application chrome: fixed top bar, scrolling page body, footer.
 *
 * Note there is no `<RemiLauncher />` here yet. In the legacy app it is a global
 * always-mounted element rather than part of the Remi screen, and the harness
 * asserts on it across mode switches — so it belongs here, and will land with
 * the Remi port in Checkpoint 1.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <RemiLauncher />
      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        BayouCare · DevDays 2026 · Demo data only — not for clinical use
      </footer>
    </div>
  )
}
