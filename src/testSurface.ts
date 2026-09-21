import { remiAnswer } from '@/engine/remi/answer'
import { remiSafeHtml } from '@/engine/remi/safeHtml'
import { plco2012, riskBreast, riskColo, riskLung } from '@/engine/screening'
import { ruleFind } from '@/engine/survivorship/lateRules'
import { scpModel } from '@/engine/survivorship/planRows'
import { ACTIONS, TEAM_PATIENTS, probabilityOf, riskOf, useTeam } from '@/store/team'
import { PATIENTS, SURVIVORS } from '@/data'
import { useCheckins } from '@/store/checkins'
import { usePatient } from '@/store/patient'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'

/**
 * A handle on the app's internals, for the verification harnesses.
 *
 * The ~260 existing assertions in bayoucare-react-verify drive the legacy build
 * by calling into it directly — `setAuth('in')`, `remiAnswer(q)`,
 * `applyPatient('yolanda')`. Keeping that surface alive is what makes the
 * regression net portable to the React app instead of being thrown away and
 * rewritten, which four days out would mean having no net at all.
 *
 * Installed unconditionally rather than behind `import.meta.env.DEV`: every one
 * of these is already reachable from the public bundle, so gating it would cost
 * the harnesses access without hiding anything. Do not add secrets here.
 */
export function installTestSurface() {
  const w = window as unknown as Record<string, unknown>

  w.__bc = {
    remiAnswer,
    remiSafeHtml,
    PATIENTS,

    // Screening calculators, for golden-value comparison against the legacy.
    riskLung,
    riskBreast,
    riskColo,
    plco2012,

    // The late-effects engine and its consumer, likewise.
    SURVIVORS,
    ruleFind,
    scpModel,

    // The care-team model, for golden-value comparison against the legacy.
    team: { TEAM_PATIENTS, ACTIONS, riskOf, probabilityOf },

    // Stores the harnesses drive directly.
    vitals: useVitals,
    checkins: useCheckins,
    teamStore: useTeam,

    /** Skip the sign-in gate, as the legacy harnesses do. */
    setAuth: (auth: 'pending' | 'out' | 'in') => useSession.setState({ auth }),
    setMode: (mode: 'patient' | 'admin') => useUi.setState({ mode }),
    setLang: (lang: string) => useUi.setState({ lang: lang as never }),
    applyPatient: (pid: keyof typeof PATIENTS) => usePatient.setState({ pid }),

    state: () => ({
      auth: useSession.getState().auth,
      role: useSession.getState().role,
      mode: useUi.getState().mode,
      lang: useUi.getState().lang,
      pid: usePatient.getState().pid,
    }),
  }
}
