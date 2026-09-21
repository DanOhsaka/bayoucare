import { useParams } from 'react-router-dom'

import { PATIENT_SCREENS, PatientSidebar } from '@/components/patient/PatientSidebar'
import { HomeScreen } from '@/screens/HomeScreen'
import { CalendarScreen } from '@/screens/CalendarScreen'
import { isScreen } from '@/components/layout/navItems'
import { Placeholder } from '@/routes/Placeholder'
import { useT } from '@/hooks/useT'

/**
 * The patient app: a sidebar of nine sections beside the active one.
 *
 * The URL selects the section, so a refresh keeps your place and the back
 * button walks between them — neither of which the legacy class-toggling did.
 * Screens that are not ported yet fall through to the placeholder, which links
 * to the legacy build for comparison.
 *
 * Note for later checkpoints: the legacy app kept every screen mounted at once
 * and hid the inactive ones with CSS, because some of them run timers whose
 * output other screens consume (the 2am vitals replay feeds the Morning Sweep).
 * Rendering one screen at a time is fine only as long as those timers live in
 * stores or at the app root rather than inside a screen component — which is
 * where they are going.
 */
export function MyCare() {
  const { screen } = useParams()
  const t = useT()

  const active = isScreen(screen) ? screen : 'home'

  function renderScreen() {
    switch (active) {
      case 'home':
        return <HomeScreen />
      case 'calendar':
        return <CalendarScreen />
      default: {
        const meta = PATIENT_SCREENS.find((s) => s.key === active)
        return (
          <Placeholder
            title={meta ? t(meta.labelKey) : active}
            view={`app/${active}`}
          />
        )
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
      <PatientSidebar />
      <div className="mt-4 min-w-0 lg:mt-0">{renderScreen()}</div>
    </div>
  )
}
