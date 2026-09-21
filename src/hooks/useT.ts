import { useCallback } from 'react'
import { useUi } from '@/store/ui'
import { interp, translate } from '@/lib/i18n'

type Vars = Record<string, string | number>

/**
 * Translate a key in the active language, re-rendering when the language
 * changes. Pass `vars` to substitute per-patient tokens such as `{name}`.
 */
export function useT() {
  const lang = useUi((s) => s.lang)

  return useCallback(
    (key: string, vars?: Vars) => {
      const s = translate(lang, key)
      return vars ? interp(s, vars) : s
    },
    [lang],
  )
}
