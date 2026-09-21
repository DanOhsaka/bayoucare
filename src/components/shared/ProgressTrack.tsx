import { cn } from '@/lib/utils'

/**
 * The one progress/risk track.
 *
 * There were five of these, hand-written in four screens, each with its own
 * fill colour and its own geometry — the care-team roster, the counterfactual
 * board, the eligibility rail, the referral rail and the FIT-kit tracker. They
 * were meant to look the same and had drifted: two of them disagreed about
 * which amber meant "watch".
 *
 * Tone is a closed vocabulary rather than a class string, so a caller cannot
 * invent a sixth shade. `riskTone` is exported because the band thresholds are
 * a clinical convention, not a styling choice — anything scoring a 7-day risk
 * should band it the same way the roster does.
 */
const TONE = {
  brand: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const

export type TrackTone = keyof typeof TONE

/** The care-team risk bands. Shared so two screens cannot disagree. */
export function riskTone(pct: number): TrackTone {
  return pct >= 50 ? 'danger' : pct >= 25 ? 'warning' : 'brand'
}

export function ProgressTrack({
  pct,
  tone = 'brand',
  label,
  labelWidth = 'w-32',
  valueText,
  width = 'w-9',
  className,
}: {
  /** 0-100. Clamped rather than trusted; a caller passing 120 should not paint outside the track. */
  pct: number
  tone?: TrackTone
  /** Optional left-hand label — the counterfactual board labels each factor. */
  label?: string
  labelWidth?: string
  /** Rendered to the right. The bar itself is decorative — this is the value. */
  valueText?: string
  width?: string
  className?: string
}) {
  const w = Math.max(0, Math.min(100, pct))

  return (
    /*
      `flex-1 min-w-0` on the root so the track fills whatever row it is placed
      in. Without it the component sizes to its content, and a caller that used
      to have a `flex-1` on the track itself (the FIT-kit tracker) silently got
      a content-width row that pushed its card — and then the page — sideways.
      A no-op outside a flex parent, which is where the other four callers
      sometimes put it.
    */
    <div className={cn('flex min-w-0 flex-1 items-center gap-2', className)}>
      {label ? (
        <span className={cn('flex-none text-xs text-muted-foreground', labelWidth)}>{label}</span>
      ) : null}
      {/*
        No `min-w` on the track. It had one, inherited from the roster cell it
        was extracted from, and that min-content floor was what broke the FIT-kit
        card at 320px: the track's floor plus the value's fixed width plus the
        row's label exceeded the column, and a grid item cannot shrink below its
        content — so the column grew to 358px and took the page with it. `flex-1`
        already fills whatever room exists; a floor only ever costs space.
      */}
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        {/*
          `aria-hidden` on purpose: the number is beside it in text, so marking
          the bar up as a progressbar too would announce every value twice. The
          fill is wider than the track on a phone, so it is clipped, not scaled.
        */}
        <i
          className={cn('block h-full rounded-full', TONE[tone])}
          style={{ width: `${w}%` }}
          aria-hidden="true"
        />
      </div>
      {valueText ? (
        <span className={cn('flex-none text-right text-xs font-bold text-card-foreground', width)}>
          {valueText}
        </span>
      ) : null}
    </div>
  )
}
