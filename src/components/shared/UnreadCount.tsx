import { cn } from '@/lib/utils'

/** Compact count pill for unread care-team messages (`+1`, `3`, `9+`). */
export function UnreadCount({
  count,
  className,
  tone = 'danger',
}: {
  count: number
  className?: string
  /** On a dark/active nav row, use on-dark so the pill stays readable. */
  tone?: 'danger' | 'onDark'
}) {
  if (count <= 0) return null
  const label = count > 9 ? '9+' : count === 1 ? '+1' : String(count)

  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
        tone === 'danger'
          ? 'bg-danger text-on-danger'
          : 'bg-on-dark/20 text-on-dark',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  )
}
