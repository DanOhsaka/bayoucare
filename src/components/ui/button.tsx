import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  // `max-w-full` for the same reason `Badge` has it: `shrink-0` +
  // `whitespace-nowrap` means a long label cannot shrink OR wrap, so a button
  // wider than its container pushes the page sideways. A caller that needs to
  // fit a long label adds `h-auto min-h-11 py-2 whitespace-normal text-left`
  // and it wraps to a second line instead. The `min-h-11` is not optional:
  // `h-auto` alone hands the height back to the padding, and a two-line label
  // at `text-xs` measures 33px, which is under the touch floor — the two
  // utilities answer different questions and both are needed.
  "relative isolate inline-flex max-w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-out outline-hidden focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-px motion-safe:active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-white/15 bg-primary text-primary-foreground shadow-[var(--shadow)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.22),transparent_55%)] hover:bg-primary/92 hover:shadow-[var(--shadow-lg)] motion-safe:active:shadow-[var(--shadow-press)]",
        destructive:
          "border border-white/10 bg-destructive text-white shadow-[var(--shadow-sm)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.18),transparent_55%)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 motion-safe:active:shadow-[var(--shadow-press)]",
        outline:
          "border border-border bg-background/80 shadow-[var(--shadow-sm)] backdrop-blur-sm [background-image:linear-gradient(180deg,rgba(255,255,255,0.35),transparent_50%)] hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--shadow)] dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:[background-image:linear-gradient(180deg,rgba(255,255,255,0.08),transparent_50%)] motion-safe:active:shadow-[var(--shadow-press)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--shadow-sm)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.3),transparent_55%)] hover:bg-secondary/80 motion-safe:active:shadow-[var(--shadow-press)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 motion-safe:active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      /*
       * Every size is 44px tall below `lg`, then restores its designed height.
       *
       * The ramp above `lg` is a DENSITY scale for a mouse: 24/32/36/40px are
       * all deliberate there and all comfortable to click. None of them is a
       * legal thumb target — 44x44 is the floor — and the controls that use the
       * small sizes are not desktop-only, so a phone and a tablet were getting
       * a 24px chip and a 32px pill to tap.
       *
       * The breakpoint is `lg`, deliberately, not `sm` or `md`: a tablet is a
       * touch screen, so the compact sizes must not come back at 768px. Only
       * from 1024px does the pointer get to be assumed.
       *
       * `lg` grows to 48 rather than 44 so the ramp keeps an obvious top end
       * instead of flattening to the same height as `default`.
       *
       * `min-w-11` covers the other axis. Height alone was not enough: a
       * two-character label like "All" is 35px wide and a bare "↓" is 27px, so
       * the shortest labels were still sub-44 targets after the height fix.
       * `lg:min-w-0` restores the designed width, so nothing above `lg` moves.
       */
      size: {
        default: "h-11 min-w-11 px-4 py-2 has-[>svg]:px-3 lg:h-9 lg:min-w-0",
        xs: "h-11 min-w-11 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3 lg:h-6 lg:min-w-0",
        sm: "h-11 min-w-11 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 lg:h-8 lg:min-w-0",
        lg: "h-12 min-w-11 rounded-md px-6 has-[>svg]:px-4 lg:h-10 lg:min-w-0",
        icon: "size-11 lg:size-9",
        "icon-xs": "size-11 rounded-md [&_svg:not([class*='size-'])]:size-3 lg:size-6",
        "icon-sm": "size-11 lg:size-8",
        "icon-lg": "size-11 lg:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

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
