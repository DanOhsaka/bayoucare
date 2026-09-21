import { Navigate, useParams } from 'react-router-dom'

import { PatientSidebar } from '@/components/patient/PatientSidebar'
import { HomeScreen } from '@/screens/HomeScreen'
import { CalendarScreen } from '@/screens/CalendarScreen'
import { RemiScreen } from '@/screens/RemiScreen'
import { PreventScreen } from '@/screens/PreventScreen'
import { JourneyScreen } from '@/screens/JourneyScreen'
import { UnderstandScreen } from '@/screens/UnderstandScreen'
import { CheckinsScreen } from '@/screens/CheckinsScreen'
import { VitalsScreen } from '@/screens/VitalsScreen'
import { AccessScreen } from '@/screens/AccessScreen'
import { isScreen } from '@/components/layout/navItems'

/**
 * The patient app: a sidebar of nine sections beside the active one.
 *
 * The URL selects the section, so a refresh keeps your place and the back
 * button walks between them — neither of which the legacy class-toggling did.
 * All nine sections are built; there is no longer a fall-through placeholder.
 *
 * Note: the legacy app kept every screen mounted at once and hid the inactive
 * ones with CSS, because some of them run timers whose output other screens
 * consume (the 2am vitals replay feeds the Morning Sweep). Rendering one screen
 * at a time is fine only as long as those timers live in stores or at the app
 * root rather than inside a screen component — which is where they are.
 */
export function MyCare() {
  const { screen } = useParams()

  const active = isScreen(screen) ? screen : 'home'

  function renderScreen() {
    switch (active) {
      case 'home':
        return <HomeScreen />
      case 'calendar':
        return <CalendarScreen />
      case 'remi':
        return <RemiScreen />
      case 'prevent':
        return <PreventScreen />
      case 'journey':
        return <JourneyScreen />
      case 'understand':
        return <UnderstandScreen />
      case 'checkins':
        return <CheckinsScreen />
      case 'vitals':
        return <VitalsScreen />
      case 'access':
        return <AccessScreen />
      /*
       * Unreachable: `active` comes only from `isScreen()`, which narrows to the
       * nine keys handled above. It redirects rather than rendering the old
       * "not built yet" placeholder — every screen is built now, and a route
       * that advertises unfinished work is the thing being removed here.
       */
      default:
        return <Navigate to="/my-care/home" replace />
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
      <PatientSidebar />
      <div className="mt-4 min-w-0 lg:mt-0">{renderScreen()}</div>
    </div>
  )
}
