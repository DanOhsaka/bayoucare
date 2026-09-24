import { useCallback } from 'react'
import { useUi } from '@/store/ui'
import { useActivePatient, usePatient } from '@/store/patient'
import { interp, translate } from '@/lib/i18n'

type Vars = Record<string, string | number>

/**
 * Translate AND substitute the current patient's tokens.
 *
 * The legacy app had `T()` for lookup and `interp()` for substitution, called
 * together in one place. The substitution is load-bearing rather than
 * cosmetic: `home.greet` and `side.whoMeta` come from the shared dictionary, so
 * without it a language switch would write one patient's name over every other
 * patient's view. The binding would hold until someone touched the language
 * selector, then silently break.
 *
 * Reading `pid` here means the text re-renders on a patient switch, which is
 * what makes that impossible in React.
 */
export function useInterp() {
  const lang = useUi((s) => s.lang)
  const pid = usePatient((s) => s.pid)
  const patient = useActivePatient()

  return useCallback(
    (key: string, extra?: Vars) => {
      const p = patient
      if (!p) return translate(lang, key)
      return interp(translate(lang, key), {
        name: p.name.split(' ')[0] || p.name,
        full: p.name,
        age: p.age || '—',
        chip: p.chip,
        short: p.short,
        profile: p.profile,
        ...extra,
      })
    },
    [lang, pid, patient],
  )
}
