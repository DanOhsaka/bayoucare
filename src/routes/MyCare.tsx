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
 *
 * The URL selects the section, so a refresh keeps your place and the back
 * button walks between them — neither of which the legacy class-toggling did.
 * Every listed section is built; there is no longer a fall-through placeholder.
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
      /*
       * Unreachable for known screens: `active` comes from `isScreen()`. It
       * redirects rather than rendering an unfinished placeholder.
       */
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
    <div className="mx-auto max-w-6xl px-4 py-6 md:grid md:grid-cols-[240px_1fr] md:items-start md:gap-6 lg:grid-cols-[260px_1fr]">
      <PatientSidebar />
      <div className="mt-4 min-w-0 md:mt-0">{renderScreen()}</div>
    </div>
  )
}
