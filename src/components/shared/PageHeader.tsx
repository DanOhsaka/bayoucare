import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Page-level title block for screen roots.
 *
 * Hierarchy: the `h1` is the only page title on the screen; supporting copy is
 * muted; actions (pickers, primary CTAs) sit in the action slot so they read as
 * the thing to do next — not as another heading.
 *
 * Layout uses CSS grid (`minmax(0,1fr)` + auto) so a wide action cannot crush
 * the title/subtitle into a one-word column the way flex-1 + min-w-0 can.
 */
export function PageHeader({
  title,
  subtitle,
  meta,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div
        className={cn(
          'grid w-full min-w-0 grid-cols-1 gap-3',
          action && 'md:grid-cols-[minmax(0,1fr)_auto] md:items-start',
        )}
      >
        <div className="min-w-0 space-y-1.5">
          <h1 className="typo-page-title text-balance">{title}</h1>
          {subtitle ? <p className="typo-muted max-w-3xl text-pretty">{subtitle}</p> : null}
          {meta ? <div className="typo-meta">{meta}</div> : null}
        </div>
        {action ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:max-w-md md:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  )
}
