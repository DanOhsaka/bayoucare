import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface MessageScrollerProps extends ComponentPropsWithRef<'div'> {
  children?: ReactNode
  label?: string
  busy?: boolean
  navigation?: 'none' | 'rail'
}

/** Minimal stub — chat screens use a simple scroll container instead. */
export function MessageScroller({
  className,
  children,
  label = 'Messages',
  ...props
}: MessageScrollerProps) {
  return (
    <div
      data-slot="message-scroller"
      role="log"
      aria-label={label}
      className={cn('h-full overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  )
}
