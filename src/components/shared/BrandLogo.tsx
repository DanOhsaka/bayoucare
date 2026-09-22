import { cn } from '@/lib/utils'

/**
 * BayouCare brand mark — the official logo lockup (icon + wordmark + tagline).
 *
 * Prefer this over the Lucide leaf wherever the product identity appears.
 */
export function BrandLogo({
  className,
  imgClassName,
  size = 'md',
}: {
  className?: string
  imgClassName?: string
  /** Header chrome vs. login/splash. */
  size?: 'sm' | 'md' | 'lg'
}) {
  const height =
    size === 'sm' ? 'h-8 sm:h-9' : size === 'lg' ? 'h-28 sm:h-32' : 'h-10'

  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src="/bayoucare-logo.png"
        alt="BayouCare — Supporting Louisiana through every step"
        className={cn('w-auto object-contain', height, imgClassName)}
        decoding="async"
      />
    </span>
  )
}
