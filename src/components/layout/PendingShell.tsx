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
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-5 border-0 bg-background outline-none"
    >
      <BrandLogo size="lg" className="border-0 shadow-none" />
      <Loader variant="comet" size={36} label="Loading" className="text-primary" />
    </div>
  )
}
