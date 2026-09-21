import { useEffect } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

import { LoginGate } from '@/components/auth/LoginGate'
import { AppShell } from '@/components/layout/AppShell'
import { MyCare } from '@/routes/MyCare'
import { Placeholder } from '@/routes/Placeholder'
import { useSession } from '@/store/session'
import { useT } from '@/hooks/useT'

/** Views only a clinician account may open. */
const ADMIN_PATHS = ['/care-team', '/clinic-ops', '/survivorship', '/population', '/roadmap']

/**
 * Keeps a patient account out of the admin views.
 *
 * Deep linking is new in this port, and it would otherwise be a way around the
 * role gate: the mode switch is hidden from patients in the chrome, but a
 * patient who typed `#/clinic-ops` would land straight in the god-view. That
 * gate has to be enforced on the route, not just hidden in the chrome.
 */
function RoleGuard() {
  const role = useSession((s) => s.role)
  const { pathname } = useLocation()

  if (role !== 'clinician' && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return <Navigate to="/overview" replace />
  }
  return <Outlet />
}

export default function App() {
  const auth = useSession((s) => s.auth)
  const check = useSession((s) => s.check)
  const t = useT()

  useEffect(() => {
    void check()
  }, [check])

  // `pending` renders nothing at all — not the gate, not the app. Painting the
  // app and then covering it would flash a patient's record at whoever is
  // signing in, which is the one thing a gate exists to prevent. Returning null
  // enforces that in React rather than relying on a CSS rule, which is also why
  // the legacy `body > *:not(#loginGate)` selector had to be abandoned: React
  // renders into #root, so that rule would have hidden the gate itself.
  if (auth === 'pending') return null
  if (auth === 'out') return <LoginGate />

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />

            <Route path="/overview" element={<Placeholder title={t('nav.overview')} view="overview" />} />
            <Route path="/my-care" element={<Navigate to="/my-care/home" replace />} />
            <Route path="/my-care/:screen" element={<MyCare />} />
            <Route path="/my-plan" element={<Placeholder title={t('nav.myplan')} view="myplan" />} />

            <Route element={<RoleGuard />}>
              <Route path="/care-team" element={<Placeholder title={t('nav.team')} view="team" />} />
              <Route path="/clinic-ops" element={<Placeholder title={t('nav.clinicops')} view="clinicops" />} />
              <Route
                path="/survivorship"
                element={<Placeholder title={t('nav.surv')} view="survivorship" />}
              />
              <Route path="/population" element={<Placeholder title={t('nav.pop')} view="population" />} />
              <Route path="/roadmap" element={<Placeholder title={t('nav.roadmap')} view="roadmap" />} />
            </Route>

            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster />
    </>
  )
}
