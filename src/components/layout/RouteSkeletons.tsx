import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Soft block used by route skeletons — matches card rhythm, not a spinner. */
function Block({ className }: { className?: string }) {
  return <Skeleton className={cn('rounded-2xl', className)} />
}

/**
 * Dashboard / overview shaped placeholder — reserves hero + shortcut grid height.
 */
export function OverviewSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-6',
        className,
      )}
    >
      <Block className="h-44 w-full sm:h-52" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-[4.5rem]" />
        ))}
      </div>
      <Block className="h-24 w-full" />
    </div>
  )
}

/**
 * My Care content column — matches typical card stack without remounting sidebar.
 */
export function CareContentSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading care section"
      className={cn('flex min-h-[28rem] flex-col gap-4', className)}
    >
      <Block className="h-28 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Block className="h-40" />
        <Block className="h-40" />
      </div>
      <Block className="h-48 w-full" />
    </div>
  )
}

/**
 * My Plan / long-form plan page.
 */
export function PlanSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading plan"
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-6',
        className,
      )}
    >
      <Block className="h-16 w-full max-w-md" />
      <Block className="h-64 w-full" />
      <Block className="h-40 w-full" />
    </div>
  )
}
