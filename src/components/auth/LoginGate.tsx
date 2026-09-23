import { LoginForm } from '@/components/auth/LoginForm'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/components/motion/center-morph-modal'
import { useT } from '@/hooks/useT'

/**
 * /login deep link — same form, presented as a centered morph surface.
 */
export function LoginGate() {
  const t = useT()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(900px_480px_at_50%_-10%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_62%)]" />
      </div>

      <CenterMorphModal defaultOpen>
        <CenterMorphModalContent
          ariaLabel={t('login.title')}
          showCloseButton={false}
          dismissible={false}
          className="max-h-[min(92vh,720px)] overflow-y-auto bg-card shadow-[var(--shadow-lg)]"
        >
          <LoginForm showBack />
        </CenterMorphModalContent>
      </CenterMorphModal>
    </div>
  )
}
