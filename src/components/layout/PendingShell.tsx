import { BrandLogo } from '@/components/shared/BrandLogo'

/**
 * What the app shows while `/api/session` is in flight.
 *
 * `App` deliberately renders nothing in that window rather than painting the
 * app and covering it — a covered app still flashes a patient's record at
 * whoever is signing in, which is the one thing a gate exists to prevent. That
 * decision is correct and stays. What was wrong is that "nothing" was LITERALLY
 * nothing: a white page for as long as the request takes, measured at 1.0s warm
 * and 4.1s on a cold function, and longer still for a returning user because
 * `enter()` also awaits the patient record before flipping.
 *
 * Four seconds of white reads as broken, not as loading — nothing on screen
 * tells the two apart.
 *
 * So this renders, and it is built to be PROVABLY free of record data: a
 * wordmark and an indeterminate bar, nothing else. No header (it carries the
 * email pill and, for clinicians, the patient picker), no shell, no names.
 * Anything added here must clear that bar.
 */
export function PendingShell() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background"
    >
      <BrandLogo size="lg" />

      {/*
        An indeterminate bar rather than a spinner: it reads as "working, length
        unknown", which is exactly the truth here, and it survives the global
        `prefers-reduced-motion` rule that would freeze a rotating element at a
        fixed angle and look like a stall.
      */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-soft">
        <div className="h-full w-1/3 rounded-full bg-brand-700 motion-safe:animate-[pending-sweep_1.2s_ease-in-out_infinite]" />
      </div>

      <span className="sr-only">Loading</span>
    </div>
  )
}
