import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

import { LoginGate } from '@/components/auth/LoginGate'
import { RequireClinician } from '@/components/auth/RequireClinician'
import { AppShell } from '@/components/layout/AppShell'
import { PendingShell } from '@/components/layout/PendingShell'
import { MyCare } from '@/routes/MyCare'
import { OverviewScreen } from '@/screens/OverviewScreen'
import { MyPlanScreen } from '@/screens/MyPlanScreen'
import { TeamScreen } from '@/screens/TeamScreen'
import { RoadmapScreen } from '@/screens/RoadmapScreen'
import { SurvivorshipScreen } from '@/screens/SurvivorshipScreen'
import { PopulationScreen } from '@/screens/PopulationScreen'
import { ClinicOpsScreen } from '@/screens/ClinicOpsScreen'
import { useSession } from '@/store/session'

export default function App() {
  const auth = useSession((s) => s.auth)
  const check = useSession((s) => s.check)

  useEffect(() => {
    void check()
  }, [check])

  // `pending` shows the loading shell — not the gate, not the app. Painting the
  // app and then covering it would flash a patient's record at whoever is
  // signing in, which is the one thing a gate exists to prevent. The shell
  // upholds that same invariant while showing that something is happening: it
  // was `return null` until now, i.e. a white page for as long as the request
  // takes (1.0s warm, 4.1s cold, measured), which reads as broken rather than
  // as loading. See PendingShell — anything added to it must carry no record
  // data, which is why the header is not part of it.
  if (auth === 'pending') return <PendingShell />
  if (auth === 'out') return <LoginGate />

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />

            <Route path="/overview" element={<OverviewScreen />} />
            <Route path="/my-care" element={<Navigate to="/my-care/home" replace />} />
            <Route path="/my-care/:screen" element={<MyCare />} />
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
      <Toaster />
    </>
  )
}
