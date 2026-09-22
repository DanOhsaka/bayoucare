import * as React from "react"
import { cn } from "@/lib/utils"

/*
 * Aligned to BayouCare's established card idiom, deliberately NOT left on
 * Shadcn's defaults.
 *
 * The app hand-writes cards as
 * `rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]`, and this
 * primitive matches that so adopting it is a no-op instead of a visual
 * regression.
 *
 * `data-interactive` marks cards that open or navigate — soft lift on hover,
 * never applied to static information cards.
 */
function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      data-interactive={interactive || undefined}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow)] transition-[box-shadow,border-color,transform] duration-200 ease-out",
        interactive &&
          "cursor-pointer motion-safe:hover:-translate-y-0.5 hover:border-brand-600/35 hover:shadow-[var(--shadow-lg)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("typo-card-title", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("typo-muted", className)}
      {...props}
    />
  )
}

/** The right-hand slot of a header row — a chip, a button, a control. */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

/** Structural only: `Card` already carries the padding. */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
