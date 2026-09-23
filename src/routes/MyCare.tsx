import { Navigate, useParams } from 'react-router-dom'

import { PatientSidebar } from '@/components/patient/PatientSidebar'
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
import { isScreen } from '@/components/layout/navItems'

/**
 * The patient app: a sidebar of sections beside the active one.
 */
export function MyCare() {
  const { screen } = useParams()

  if (!isScreen(screen)) {
    return <Navigate to="/my-care/home" replace />
  }

  const active = screen

  function renderScreen() {
    switch (active) {
      case 'home':
        return <HomeScreen />
      case 'family':
        return <FamilyHelpScreen />
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
      case 'messages':
        return <CareChatScreen />
      default:
        return <Navigate to="/my-care/home" replace />
    }
  }

  /*
   * The two-column split starts at `md`, not `lg`.
   *
   * `lg:grid` here was paired with `lg:flex-col` in `PatientSidebar`, so
   * between 768 and 1023 the nine sections were a horizontal pill strip
   * scrolling past a full tablet width of empty header — the layout was
   * deferred precisely because moving one of the pair without the other
   * produces a sidebar beside a nav that is still a row, or the reverse. Both
   * sides move together; see the note in `PatientSidebar`.
   *
   * The column is 240px at `md` (it widens to the designed 260px at `lg`)
   * because at 768 the content column is the tightest it ever gets, and the
   * calendar and the two-up grids below it are the ones that feel it first.
   */
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:grid md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:items-start md:gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
      <PatientSidebar />
      <div className="mt-3 min-w-0 md:mt-0">{renderScreen()}</div>
    </div>
  )
}
