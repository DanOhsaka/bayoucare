import { LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { LoginForm } from '@/components/auth/LoginForm'
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalTrigger,
} from '@/components/motion/center-morph-modal'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { ThemeModeControl } from '@/components/shared/ThemeModeControl'
import { Button } from '@/components/ui/button'
import { LANG_TOAST } from '@/data'
import { LANGS, LANG_LABELS, LANG_SHORT, type Lang } from '@/lib/i18n'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

const CONTROL =
  'flex h-11 flex-none items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 text-xs font-medium text-foreground backdrop-blur-md transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-9'

/**
 * Public chrome — sign-in opens with beUI center-morph unfold.
 */
export function PublicHeader() {
  const t = useT()
  const lang = useUi((s) => s.lang)
  const setLang = useUi((s) => s.setLang)
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
          <label className="sr-only" htmlFor="bc-public-lang">
            Language
          </label>
          <select
            id="bc-public-lang"
            value={lang}
            title={LANG_LABELS[lang]}
            onChange={(e) => {
              const next = e.target.value as Lang
              setLang(next)
              toast(LANG_TOAST[next] ?? LANG_TOAST.en)
            }}
            className={cn(CONTROL, 'max-w-[4.75rem] px-1.5 sm:max-w-none sm:px-2.5')}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_SHORT[l]} · {LANG_LABELS[l]}
              </option>
            ))}
          </select>

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
