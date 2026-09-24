import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

import { LoginGate } from '@/components/auth/LoginGate'
import { AuthFade } from '@/components/auth/SigningInStage'
import { RequireClinician } from '@/components/auth/RequireClinician'
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import { PendingShell } from '@/components/layout/PendingShell'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
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
import { HomeScreen } from '@/screens/HomeScreen'
import { CalendarScreen } from '@/screens/CalendarScreen'
import { RemiScreen } from '@/screens/RemiScreen'
import { CareChatScreen } from '@/screens/CareChatScreen'
import { FamilyHelpScreen } from '@/screens/FamilyHelpScreen'
import { PreventScreen } from '@/screens/PreventScreen'
import { JourneyScreen } from '@/screens/JourneyScreen'
import { UnderstandScreen } from '@/screens/UnderstandScreen'
import { CheckinsScreen } from '@/screens/CheckinsScreen'
import { VitalsScreen } from '@/screens/VitalsScreen'
import { AccessScreen } from '@/screens/AccessScreen'
import { useSession } from '@/store/session'

function PublicApp() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/demo" element={<DemoAccountsPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function SignedInApp() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/login" element={<Navigate to="/overview" replace />} />

          <Route path="/overview" element={<OverviewScreen />} />

          <Route path="/my-care" element={<MyCare />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomeScreen />} />
            <Route path="family" element={<FamilyHelpScreen />} />
            <Route path="calendar" element={<CalendarScreen />} />
            <Route path="remi" element={<RemiScreen />} />
            <Route path="prevent" element={<PreventScreen />} />
            <Route path="journey" element={<JourneyScreen />} />
            <Route path="understand" element={<UnderstandScreen />} />
            <Route path="checkins" element={<CheckinsScreen />} />
            <Route path="vitals" element={<VitalsScreen />} />
            <Route path="access" element={<AccessScreen />} />
            <Route path="messages" element={<CareChatScreen />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Route>

          <Route path="/my-plan" element={<MyPlanScreen />} />

          <Route path="/care-team" element={<RequireClinician><TeamScreen /></RequireClinician>} />
          <Route path="/clinic-ops" element={<RequireClinician><ClinicOpsScreen /></RequireClinician>} />
          <Route path="/survivorship" element={<RequireClinician><SurvivorshipScreen /></RequireClinician>} />
          <Route path="/population" element={<RequireClinician><PopulationScreen /></RequireClinician>} />
          <Route path="/roadmap" element={<RequireClinician><RoadmapScreen /></RequireClinician>} />

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
