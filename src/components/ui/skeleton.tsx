import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Pulse placeholder for loading regions. Prefer shaping the skeleton to the
 * content it replaces (chart disc, title strip, summary rows) rather than a
 * generic spinner. Soft pulse respects reduced-motion via the global CSS gate.
 */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('rounded-md bg-muted/80 motion-safe:animate-pulse', className)}
      {...props}
    />
  )
}

export { Skeleton }
