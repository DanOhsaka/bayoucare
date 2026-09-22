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
  // No `outline-none`: it suppresses the app's single global `:focus-visible`
  // ring (utilities outrank `@layer base`), leaving a 1px border tint as the
  // only focus cue. The border still shifts to `--ring` as well.
  //
  // 44px below `lg`, the designed 40px above it. A 40px field is a mouse-sized
  // field; it is 4px under the thumb floor and a text input is the one control
  // a user has to hit twice (once to focus, once to place the caret).
  'h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_22%,transparent)] lg:h-10'

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
      // `min-h-11` at base: the py-1 pill measures 27px, which is the smallest
      // tap target in the app and the one most often used in a row (the
      // calculator personas are six of them side by side). `lg:min-h-0` hands
      // the height back to the padding at the one width it was designed for.
      className="min-h-11 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-brand-600/40 hover:bg-accent hover:shadow-[var(--shadow-sm)] motion-safe:active:scale-[0.98] lg:min-h-0"
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
