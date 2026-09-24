import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import {
  AnimatedBadge,
  type AnimatedBadgeStatus,
} from '@/components/motion/animated-badge'
import { cn } from '@/lib/utils'

/*
 * Status variants route through beUI AnimatedBadge (icons + pulse). Saturated
 * fills (solid-*, brand) stay as static chips for chrome / density cases.
 */
const badgeVariants = cva(
  'inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive: 'bg-destructive text-on-danger [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-link underline-offset-4 [a&]:hover:underline',

        success: 'bg-success-bg text-success-fg',
        warning: 'bg-warning-bg text-warning-fg',
        danger: 'bg-danger-bg text-danger-fg',
        info: 'bg-info-bg text-info-fg',
        neutral: 'bg-muted text-muted-foreground',

        'solid-success': 'bg-success text-on-dark',
        'solid-warning': 'bg-warning text-on-warning',
        'solid-danger': 'bg-danger text-on-danger',
        brand: 'bg-brand-700 text-on-dark',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const ANIMATED_STATUS: Partial<
  Record<NonNullable<VariantProps<typeof badgeVariants>['variant']>, AnimatedBadgeStatus>
> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  destructive: 'danger',
  info: 'info',
  neutral: 'neutral',
  default: 'info',
}

function Badge({
  className,
  variant = 'default',
  asChild = false,
  animated = true,
  children,
  title,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    /** When false, skip beUI AnimatedBadge (no status icon / roll). */
    animated?: boolean
  }) {
  const animatedStatus = variant ? ANIMATED_STATUS[variant] : undefined

  if (animated && animatedStatus && !asChild) {
    return (
      <AnimatedBadge
        status={animatedStatus}
        size="sm"
        title={typeof title === 'string' ? title : undefined}
        className={cn('max-w-full font-bold', className)}
      >
        {children}
      </AnimatedBadge>
    )
  }

  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      title={title}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
