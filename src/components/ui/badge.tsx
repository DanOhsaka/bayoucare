import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/*
 * Aligned to BayouCare's chip idiom, so adopting it is a no-op.
 *
 * The app hand-writes ~53 status pills and — the real tell — ELEVEN separate
 * status→class maps (`TAG_CLASS`, `TIER_CHIP` ×2, `STATUS_CHIP`, `PILL`,
 * `TONE`, `CHIP`, `CRIT_STYLE`, `CHIP_KIND`, `BADGE`, `TAG`) that are each
 * just this component's `variant` prop written out again. Five of those maps
 * are the same three pairs repeated.
 *
 * Geometry matches the measured dominant string
 * (`rounded-full px-2.5 py-1 text-xs font-bold`), not Shadcn's
 * (`px-2 py-0.5 text-xs font-medium`).
 *
 * The status variants are PAIRS (`bg-*-bg` + `text-*-fg`) because that is the
 * whole point of the paired tokens: picking a foreground and a background
 * independently is exactly how the legacy app reached 1.71:1. The `solid-*`
 * variants are the other legitimate shape — saturated fill, dark text — and
 * use the matching `--on-*` token rather than a hand-picked literal.
 */
const badgeVariants = cva(
  // `max-w-full` so a badge can never exceed its container. The status
  // variants keep `whitespace-nowrap` — a chip that reads "Confirm-ed" is worse
  // than no chip — but the descriptive tags (which carry a whole sentence) pass
  // `whitespace-normal` and wrap instead of being clipped by `overflow-hidden`.
  "inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "bg-destructive text-on-danger [a&]:hover:bg-destructive/90",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-link underline-offset-4 [a&]:hover:underline",

        /* The app's status vocabulary — foreground and background together. */
        success: "bg-success-bg text-success-fg",
        warning: "bg-warning-bg text-warning-fg",
        danger: "bg-danger-bg text-danger-fg",
        info: "bg-info-bg text-info-fg",
        neutral: "bg-muted text-muted-foreground",

        /* Saturated fills: the top of the severity ramp and the brand chrome. */
        "solid-success": "bg-success text-on-dark",
        "solid-warning": "bg-warning text-on-warning",
        "solid-danger": "bg-danger text-on-danger",
        brand: "bg-brand-700 text-on-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
