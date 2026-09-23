import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

import { LoginGate } from '@/components/auth/LoginGate'
import { AuthFade } from '@/components/auth/SigningInStage'
import { RequireClinician } from '@/components/auth/RequireClinician'
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import { PendingShell } from '@/components/layout/PendingShell'
import { MyCare } from '@/routes/MyCare'
import { LandingPage } from '@/screens/LandingPage'
import { DemoAccountsPage } from '@/screens/DemoAccountsPage'
import { NotFoundScreen } from '@/screens/NotFoundScreen'
import { OverviewScreen } from '@/screens/OverviewScreen'
import { MyPlanScreen } from '@/screens/MyPlanScreen'
import { TeamScreen } from '@/screens/TeamScreen'
import { RoadmapScreen } from '@/screens/RoadmapScreen'
import { SurvivorshipScreen } from '@/screens/SurvivorshipScreen'
import { PopulationScreen } from '@/screens/PopulationScreen'
import { ClinicOpsScreen } from '@/screens/ClinicOpsScreen'
import { useSession } from '@/store/session'

function PublicApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/demo" element={<DemoAccountsPage />} />
        <Route path="/" element={<LandingPage />} />
        {/* Unknown public URLs → landing, not the fault page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function SignedInApp() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/login" element={<Navigate to="/overview" replace />} />

          <Route path="/overview" element={<OverviewScreen />} />
          <Route path="/my-care" element={<Navigate to="/my-care/home" replace />} />
          <Route path="/my-care/:screen" element={<MyCare />} />
          <Route path="/my-plan" element={<MyPlanScreen />} />

          <Route path="/care-team" element={<RequireClinician><TeamScreen /></RequireClinician>} />
          <Route path="/clinic-ops" element={<RequireClinician><ClinicOpsScreen /></RequireClinician>} />
          <Route path="/survivorship" element={<RequireClinician><SurvivorshipScreen /></RequireClinician>} />
          <Route path="/population" element={<RequireClinician><PopulationScreen /></RequireClinician>} />
          <Route path="/roadmap" element={<RequireClinician><RoadmapScreen /></RequireClinician>} />

          {/* Unknown signed-in URLs → overview, not the fault page. */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default function App() {
  const auth = useSession((s) => s.auth)
  const bootFault = useSession((s) => s.bootFault)
  const check = useSession((s) => s.check)

  useEffect(() => {
    void check()
  }, [check])

  // Server/session boot failures only — not ordinary “logged out” or bad hashes.
  if (bootFault) {
    return (
      <HashRouter>
        <NotFoundScreen
          code="500"
          title="Server error"
          description="The server returned an error while checking your session. Try again in a moment."
          homeHref="/"
          homeLabel="Back home"
          browseHref="/login"
          browseLabel="Try sign in"
        />
      </HashRouter>
    )
  }

  const shell =
    auth === 'pending' ? (
      <PendingShell />
    ) : auth === 'out' ? (
      <PublicApp />
    ) : (
      <SignedInApp />
    )

  return (
    <AppErrorBoundary>
      <AuthFade authKey={auth}>{shell}</AuthFade>
      <Toaster />
    </AppErrorBoundary>
  )
}
