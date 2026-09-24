import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'
import { useCheckins } from '@/store/checkins'
import { useTeam } from '@/store/team'
import { useClinic } from '@/store/clinic'
import { useAppointments } from '@/store/appointments'
import { useFamily } from '@/store/family'
import { useRemi } from '@/store/remi'
import { useCareChat } from '@/store/careChat'

/**
 * Return every store to its initial state.
 *
 * Called on sign-out, where a user switch must not leave one patient's data
 * visible to the next. The legacy app achieved this with `location.reload()`,
 * which is provably complete; a reset is complete only if this list is.
 *
 * ADD EVERY NEW STORE HERE. If you are reading this because a leak probe
 * failed, the missing store is almost certainly the cause.
 *
 * Deliberately NOT cleared, matching the reload's behaviour: the theme and
 * language preferences (`bc-theme`, `bc-lang`) and the Remi API key
 * (`bc-remi-key`). Those survive a reload too, so leaving them is parity —
 * though the API key outliving a sign-out is arguably a privacy bug, it is
 * pre-existing and out of scope for a UI port.
 */
export function resetStores() {
  const pid = 'darlene' as const

  usePatient.setState(
    { pid, selfRecord: null, profileComplete: true, selfEmail: null },
    false,
  )
  useUi.setState({ mode: 'patient' }, false)

  useVitals.getState().resetForPatient(pid)
  useCheckins.getState().resetForPatient(pid)
  useTeam.getState().reset()
  useClinic.getState().reset()
  // Wipe every patient's working copies — a clinician may have touched several.
  useAppointments.setState({ plans: {} })
  useFamily.setState({ overrides: {}, invites: [] })
  useCareChat.getState().reset()

  // Keep the Remi key; clear the conversation so the next account does not
  // inherit crisis flags or chat history from the previous one.
  useRemi.setState({ messages: [], history: [], busy: false })
}
