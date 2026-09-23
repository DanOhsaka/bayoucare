import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

/**
 * App button — beUI-inspired: rounded-full primary, soft borders, springy
 * press via CSS. Landing CTAs can also use `@/components/motion/button/base`.
 */
const buttonVariants = cva(
  'relative isolate inline-flex max-w-full shrink-0 items-center justify-center gap-2 overflow-hidden text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-hidden focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.93] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  {
    variants: {
      variant: {
        default:
          'rounded-full border border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary/90',
        destructive:
          'rounded-full border border-transparent bg-destructive text-white shadow-[var(--shadow-sm)] hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'rounded-full border border-border bg-transparent text-foreground hover:bg-muted/60 hover:border-border-strong',
        secondary:
          'rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-sm)] hover:border-border-strong',
        ghost:
          'rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        link: 'rounded-full text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 min-w-11 px-5 py-2 has-[>svg]:px-4 lg:h-10 lg:min-w-0',
        xs: 'h-11 min-w-11 gap-1 rounded-full px-3 text-xs has-[>svg]:px-2 lg:h-7 lg:min-w-0',
        sm: 'h-11 min-w-11 gap-1.5 rounded-full px-4 has-[>svg]:px-3 lg:h-8 lg:min-w-0',
        lg: 'h-12 min-w-11 rounded-full px-7 text-base has-[>svg]:px-5 lg:h-11 lg:min-w-0',
        icon: 'size-11 rounded-full lg:size-9',
        'icon-xs': 'size-11 rounded-full [&_svg:not([class*=\'size-\'])]:size-3 lg:size-7',
        'icon-sm': 'size-11 rounded-full lg:size-8',
        'icon-lg': 'size-11 rounded-full lg:size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
