import type { ReactNode } from 'react'

/**
 * A labelled form control.
 *
 * The legacy app had six `<label>`s with no `for` attribute sitting next to
 * their inputs — they looked associated but were not, so a screen reader
 * announced the fields unnamed. An explicit htmlFor is not optional here.
 */
export function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold leading-snug text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

export const INPUT_CLASS =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring'

export const SELECT_CLASS = INPUT_CLASS

/** The pill buttons that fill a calculator from a persona. */
export function PersonaButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {children}
    </button>
  )
}

/** A label/value pair in a calculator's result block. */
export function Stat({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground">{k}</span>
      <span className="block text-sm font-bold text-card-foreground">{v}</span>
    </div>
  )
}
