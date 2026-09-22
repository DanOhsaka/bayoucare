import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Page-level title block for screen roots.
 *
 * Hierarchy: the `h1` is the only page title on the screen; supporting copy is
 * muted; actions (pickers, primary CTAs) sit in the action slot so they read as
 * the thing to do next — not as another heading.
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
    <header className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="typo-page-title">{title}</h1>
          {subtitle ? <p className="typo-muted max-w-3xl">{subtitle}</p> : null}
          {meta ? <div className="typo-meta">{meta}</div> : null}
        </div>
        {action ? (
          <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  )
}
