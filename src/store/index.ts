import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'

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
  usePatient.setState({ pid: 'darlene' }, false)
  useUi.setState({ mode: 'patient' }, false)
}
