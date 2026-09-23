import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Minimal stub — full PreviewRail is not used by BayouCare surfaces. */
export interface PreviewRailItem {
  id: string
  label: string
  ariaLabel?: string
  description?: string
}

export interface PreviewRailProps extends ComponentPropsWithRef<'div'> {
  items?: PreviewRailItem[]
  children?: ReactNode
}

export function PreviewRail({ className, children, ...props }: PreviewRailProps) {
  return (
    <div data-slot="preview-rail" className={cn(className)} {...props}>
      {children}
    </div>
  )
}
