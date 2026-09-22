import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Styled to BayouCare's idiom rather than Shadcn's defaults, for the same
 * reason `card.tsx` and `badge.tsx` are: Shadcn ships `rounded-2xl` and its own
 * elevation scale, and copying it here would make this the one dialog in an app
 * whose cards are `rounded-lg` over `--shadow`.
 *
 * Radix supplies the parts that matter and are easy to get wrong by hand:
 * focus trapping, Escape, focus restore on close, `aria-modal`, and scroll
 * locking. Nothing here overrides them.
 *
 * NOTE: no `outline-none` anywhere. `src/index.css` defines one global
 * `:focus-visible` ring, and `button.tsx` previously suppressed it with
 * `outline-none` — a 1.88:1 focus indicator that only the audit caught.
 */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
        className={cn(
          "fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-150",
          className
        )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        /*
         * Set explicitly, and MEASURED rather than assumed: radix-ui 1.6.7 does
         * not emit `aria-modal` (it is only in the package's source maps), and
         * its `hideOthers` pass does not reach this app's `#root` — with the
         * booking dialog open, `#root` measured `aria-hidden: null` and no
         * `inert`. So a screen reader could browse the whole page behind an
         * open modal. `aria-modal` is the WAI-ARIA signal for exactly this, and
         * it is accurate here: focus is trapped inside by Radix, and Escape and
         * the overlay both dismiss.
         */
        aria-modal="true"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:duration-200 data-[state=closed]:duration-150",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/** `pr-8` keeps the header clear of the close control. */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 pr-8", className)}
      {...props}
    />
  )
}

/** Radix renders this as an `<h2>`; keep it that way for heading navigation. */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold text-card-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

/** The right-hand group of a footer, so a primary action can be separated. */
function DialogAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-action" className={cn("flex items-center gap-2", className)} {...props} />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogAction,
}
