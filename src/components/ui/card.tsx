import * as React from "react"
import { cn } from "@/lib/utils"

/*
 * Aligned to BayouCare's established card idiom, deliberately NOT left on
 * Shadcn's defaults.
 *
 * The app hand-writes 55 cards as
 * `rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]`, and this
 * primitive was imported by nobody — because dropping it in unchanged would
 * have silently restyled every one of them (Shadcn ships `rounded-xl` +
 * `shadow-sm`, and splits padding into `px-6` on the header/content). Matching
 * the idiom first is what makes adopting it a no-op instead of a visual
 * regression, so screens can move over one at a time.
 *
 * `gap-3` reproduces the app's uniform `mb-3` header rhythm, and `CardTitle` is
 * an `<h3>` because that is what every real screen already uses — the app has
 * 49 of them and no `<h1>` outside the placeholder.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow)]",
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
      className={cn("text-base font-semibold text-card-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
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
