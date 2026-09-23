import { BrandLogo } from '@/components/shared/BrandLogo'
import { Loader } from '@/components/motion/loader'

/**
 * What the app shows while `/api/session` is in flight.
 *
 * Built to be free of record data: wordmark + comet loader only.
 */
export function PendingShell() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background"
    >
      <BrandLogo size="lg" />
      <Loader variant="comet" size={36} label="Loading" className="text-primary" />
    </div>
  )
}
