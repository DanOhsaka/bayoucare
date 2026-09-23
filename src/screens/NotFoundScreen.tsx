import { Loader } from '@/components/motion/loader'
import { NotFoundGlitch } from '@/components/motion/not-found/glitch'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { useSession } from '@/store/session'

export type NotFoundScreenProps = {
  code?: string
  title?: string
  description?: string
  homeHref?: string
  homeLabel?: string
  browseHref?: string
  browseLabel?: string
}

/**
 * Glitch 404 / fault page — for runtime crashes and server failures only,
 * not for ordinary unknown client routes (those redirect).
 */
export function NotFoundScreen({
  code = '404',
  title,
  description,
  homeHref,
  homeLabel,
  browseHref,
  browseLabel,
}: NotFoundScreenProps = {}) {
  const auth = useSession((s) => s.auth)
  const signedIn = auth === 'in'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <BrandLogo size="sm" className="rounded-lg bg-card px-2 py-1 shadow-[var(--shadow-sm)]" />
      <div className="text-primary">
        <Loader variant="comet" size={28} label="Recovering" />
      </div>
      <NotFoundGlitch
        className="min-h-0"
        code={code}
        title={title}
        description={description}
        homeHref={homeHref ?? (signedIn ? '/overview' : '/')}
        homeLabel={homeLabel ?? 'Back home'}
        browseHref={browseHref ?? (signedIn ? '/my-care/home' : '/login')}
        browseLabel={browseLabel ?? (signedIn ? 'Open My Care' : 'Sign in')}
      />
    </div>
  )
}
