import { LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

import { LoginForm } from '@/components/auth/LoginForm'
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalTrigger,
} from '@/components/motion/center-morph-modal'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { LanguageSelect } from '@/components/shared/LanguageSelect'
import { ThemeModeControl } from '@/components/shared/ThemeModeControl'
import { Button } from '@/components/ui/button'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'

/**
 * Public chrome — sign-in opens with beUI center-morph unfold.
 */
export function PublicHeader() {
  const t = useT()
  const loginOpen = useUi((s) => s.loginOpen)
  const setLoginOpen = useUi((s) => s.setLoginOpen)

  return (
    <CenterMorphModal open={loginOpen} onOpenChange={setLoginOpen}>
      <header className="glass sticky top-0 z-40 flex items-center gap-2 border-b border-border px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:py-2.5">
        <Link to="/" className="min-w-0 flex-none" aria-label="BayouCare home">
          <BrandLogo
            size="sm"
            className="max-w-[7.25rem] rounded-lg bg-card px-1.5 py-0.5 shadow-[var(--shadow-sm)] sm:max-w-[9.5rem] md:max-w-none"
            imgClassName="max-h-8 w-auto object-contain object-left sm:max-h-9"
          />
        </Link>

        <nav className="ml-auto flex min-w-0 flex-none items-center gap-1.5 sm:gap-2.5">
          <LanguageSelect compact />

          <ThemeModeControl />

          <CenterMorphModalTrigger>
            <Button type="button" size="sm" className="gap-1.5 font-semibold">
              <LogIn className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('landing.signIn')}</span>
              <span className="sm:hidden">{t('landing.signInShort')}</span>
            </Button>
          </CenterMorphModalTrigger>
        </nav>
      </header>

      <CenterMorphModalContent
        ariaLabel={t('login.title')}
        closeButtonLabel={t('login.back')}
        className="max-h-[min(92vh,720px)] overflow-y-auto bg-card shadow-[var(--shadow-lg)]"
      >
        <LoginForm />
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
