import { useLocation, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useUi } from '@/store/ui'
import { useT } from '@/hooks/useT'

/**
 * The floating "Ask Remi" button.
 *
 * Mounted once in the app shell rather than on the Remi screen, because it has
 * to be reachable from anywhere in the patient app — and because the legacy
 * harnesses assert on it across mode switches. Hidden in admin mode, matching
 * the legacy CSS rule.
 */
export function RemiLauncher() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (mode !== 'patient') return null
  // Nothing to launch if you are already there.
  if (pathname.startsWith('/my-care/remi')) return null

  return (
    /*
      `hover:bg-primary` cancels the variant's `hover:bg-primary/90`: this button
      answers hover with scale, not a shade change, and dropping the override
      would make it the only CTA in the app that dims on hover.
    */
    <Button
      type="button"
      size="lg"
      onClick={() => navigate('/my-care/remi')}
      aria-label={t('remi.launcher')}
      className="fixed bottom-6 right-6 z-30 h-11 rounded-full font-bold shadow-[var(--shadow-lg)] transition-transform hover:scale-[1.03] hover:bg-primary"
    >
      <Leaf className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{t('remi.launcher')}</span>
    </Button>
  )
}
