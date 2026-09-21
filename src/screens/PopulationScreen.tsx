import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  CENTROIDS,
  MAP,
  METRICS,
  PARISH_DATA,
  bucketOf,
  followAction,
  outreachAction,
  parishResults,
  sideAction,
  type MetricKey,
  type ParishRow,
} from '@/engine/population/parishes'
import { useInterval } from '@/hooks/useInterval'
import { cn } from '@/lib/utils'

/** Quintile ramp. Index 0 is the suppressed bucket — a neutral tile, never a
 *  fabricated colour for a parish whose late-stage data the LTR rules withheld. */
const SCALE = [
  'bg-muted text-muted-foreground',
  'bg-brand-50 text-brand-900',
  'bg-brand-100 text-brand-900',
  'bg-warning-bg text-warning-fg',
  'bg-warning text-[#3a2400]',
  'bg-danger text-white',
]

const TONE: Record<string, string> = {
  danger: 'bg-danger-bg text-danger-fg',
  warning: 'bg-warning-bg text-warning-fg',
  success: 'bg-success-bg text-success-fg',
}

const METRIC_KEYS: MetricKey[] = ['need', 'late', 'inc', 'cov']

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
        active
          ? 'border-brand-600 bg-brand-700 text-on-dark'
          : 'border-border bg-background text-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

export function PopulationScreen() {
  const [metric, setMetric] = useState<MetricKey>('need')
  const [mode, setMode] = useState<'tiles' | 'geo'>('tiles')
  const [parish, setParish] = useState<string | null>(null)
  const [vanHere, setVanHere] = useState<string | null>(null)

  // The van tour, at the app root of this screen and cleaned up on unmount —
  // the legacy ran it un-cleared, so it kept advancing after you navigated away.
  const [tourStop, setTourStop] = useState<number | null>(null)
  const [tourLog, setTourLog] = useState<string[]>([])

  /**
   * The geographic map's hover tooltip.
   *
   * Follows the cursor with the same edge clamping the legacy used — without it
   * the panel runs off the right edge on the last few columns of the state.
   */
  const [tip, setTip] = useState<{ name: string; x: number; y: number } | null>(null)
  const tipParish = tip ? PARISH_DATA.find((p) => p.n === tip.name) : null

  const stops = useMemo(() => PARISH_DATA.filter((p) => p.rank != null).slice(0, 10), [])

  useInterval(
    () => {
      if (tourStop == null) return
      if (tourStop >= stops.length) {
        setTourStop(null)
        toast('✅ Van tour complete — 10 parishes routed by unmet need.')
        return
      }
      const p = stops[tourStop]
      setVanHere(p.n)
      setParish(p.n)
      setTourLog((l) => [
        ...l,
        `Stop ${tourStop + 1}/10 — ${p.n} — ${p.late}% late-stage · ${p.uns.toLocaleString()} unscreened · rank #${p.rank}`,
      ])
      setTourStop(tourStop + 1)
    },
    tourStop != null ? 900 : null,
  )

  const m = METRICS[metric]
  const selected = parish ? (PARISH_DATA.find((p) => p.n === parish) ?? null) : null
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">
            🗺️ Parish heat index — where screening matters most
          </h3>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            All 64 parishes · State Cancer Profiles + CDC PLACES
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          All 64 parishes scored on incidence, late-stage share, coverage, and unmet need — so
          screening vans and SMS nudges go to the{' '}
          <b className="text-card-foreground">highest-burden parishes, not just the biggest cities</b>.
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">Louisiana, by the numbers</h3>
          <div className="flex flex-wrap gap-1.5">
            {METRIC_KEYS.map((k) => (
              <Chip key={k} active={metric === k} onClick={() => setMetric(k)}>
                {METRICS[k].label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              <Chip active={mode === 'tiles'} onClick={() => setMode('tiles')}>
                🗂 Tile cartogram
              </Chip>
              <Chip active={mode === 'geo'} onClick={() => setMode('geo')}>
                🗺️ Geographic map
              </Chip>
            </div>

            {mode === 'tiles' ? (
              <div className="max-w-[760px] overflow-x-auto">
                <div className="grid grid-cols-12 gap-0.5">
                  {PARISH_DATA.map((p) => {
                    const b = bucketOf(p, metric)
                    const v = m.f(p)
                    const valTxt = v == null ? 'suppressed (<16 cases)' : m.fmt(v)
                    const rankTxt = m.worse && p.rank != null ? ` · unmet-need rank #${p.rank}` : ''
                    return (
                      <button
                        key={p.n}
                        type="button"
                        aria-pressed={parish === p.n}
                        title={`${p.n} — ${valTxt}${rankTxt}`}
                        onClick={() => setParish(p.n)}
                        style={{ gridColumn: p.x, gridRow: p.y }}
                        className={cn(
                          'relative flex h-8 items-center justify-center rounded-sm text-[10px] font-bold transition-transform hover:scale-110',
                          SCALE[b],
                          parish === p.n && 'ring-2 ring-brand-700',
                          vanHere === p.n && 'ring-2 ring-warning',
                        )}
                      >
                        {p.rank != null && p.rank <= 10 && (
                          <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-brand-700 text-[8px] text-on-dark">
                            {p.rank}
                          </span>
                        )}
                        {p.ab}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="h-auto w-full max-w-[560px]" role="img" aria-label="Louisiana parishes by screening need">
                  <title>Louisiana parishes, coloured by {m.label}</title>
                  {Object.entries(MAP.d).map(([name, d]) => {
                    const p = PARISH_DATA.find((x) => x.n === name)
                    const b = p ? bucketOf(p, metric) : 0
                    const fill =
                      b === 0
                        ? 'var(--muted)'
                        : b >= 5
                          ? 'var(--coral-500)'
                          : b === 4
                            ? 'var(--amber-500)'
                            : b === 3
                              ? 'var(--green-100)'
                              : b === 2
                                ? 'var(--green-50)'
                                : 'var(--soft)'
                    // Each path is a real control, so the map is usable without a
                    // mouse — the legacy attached click handlers to bare <path>s.
                    return (
                      <path
                        key={name}
                        d={d}
                        fill={fill}
                        stroke="var(--line)"
                        strokeWidth={0.6}
                        role="button"
                        tabIndex={0}
                        aria-label={name}
                        aria-pressed={parish === name}
                        // Hover feedback the legacy had and I had missed: the
                        // stroke darkens and thickens under the cursor, so the
                        // map reads as interactive before you click anything.
                        className={cn(
                          'cursor-pointer outline-offset-2 transition-[opacity,stroke,stroke-width] duration-100',
                          'hover:stroke-brand-900 hover:opacity-90 hover:[stroke-width:1.4]',
                          parish === name && 'stroke-brand-900 [stroke-width:1.8]',
                        )}
                        onClick={() => setParish(name)}
                        onMouseMove={(e) => setTip({ name, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setTip(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setParish(name)
                          }
                        }}
                      />
                    )
                  })}
                  {vanHere && CENTROIDS[vanHere] && (
                    <circle
                      cx={CENTROIDS[vanHere][0]}
                      cy={CENTROIDS[vanHere][1]}
                      r={6}
                      fill="var(--green-500)"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )}
                </svg>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{m.worse ? 'lower' : 'higher'} {m.label.toLowerCase()}</span>
              {SCALE.map((c, i) => (
                <span key={i} className={cn('block size-3.5 rounded-sm', c)} aria-hidden="true" />
              ))}
              <span>{m.worse ? 'higher' : 'lower'} {m.label.toLowerCase()}</span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Tile cartogram — each tile is one parish; positions approximate geography. Numbered
              badges = top-10 unmet-need rank. <b className="text-card-foreground">Incidence &amp;
              late-stage: State Cancer Profiles / USCS. Screening coverage &amp; population: CDC
              PLACES 2025. Hatched tiles = late stage suppressed (&lt;16 cases).</b>
            </p>
          </div>

          {/* ------------------------------------------------ side panel */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-card-foreground">
                {selected ? `${selected.n} Parish` : '—'}
              </h3>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-bold',
                  selected?.rank != null && selected.rank <= 10
                    ? 'bg-danger-bg text-danger-fg'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {selected
                  ? selected.rank != null
                    ? `#${selected.rank} of ${PARISH_DATA.filter((x) => x.rank != null).length} ranked by unmet need`
                    : 'Not ranked — late-stage data suppressed'
                  : 'pick a parish'}
              </span>
            </div>

            {selected && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Population', selected.pop.toLocaleString()],
                  ['Incidence /100k', String(selected.inc)],
                  ['Late-stage share', selected.late == null ? 'suppressed' : `${selected.late}%`],
                  ['Screening coverage', `${selected.cov}%`],
                  ['Eligible & unscreened', `≈ ${selected.uns.toLocaleString()}`],
                  ['30-day action', sideAction(selected)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="block text-xs text-muted-foreground">{k}</span>
                    <span className="block font-bold text-card-foreground">{v}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!selected) return toast('Pick a parish on the map first.')
                  setVanHere(selected.n)
                  toast(`🚐 Van routed to ${selected.n} — mobile screening unit arrives Saturday.`)
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                🚐 Route van here
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selected) return toast('Pick a parish on the map first.')
                  toast(
                    `📲 ${selected.uns.toLocaleString()} un-screened adults queued for SMS nudges (event invites + LA Quitline) in ${selected.n}.`,
                  )
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
              >
                📲 SMS nudge cohort
              </button>
            </div>

            <div className="mt-3 max-h-[140px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-[11px] leading-relaxed text-on-dark">
              {tourLog.length === 0 ? (
                <span className="text-on-dark-muted">
                  Van tour log — deploy to the top-10 parishes to watch routing live.
                </span>
              ) : (
                tourLog.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ outreach queue */}
      <section className="mt-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">
            Risk-stratified outreach queue
          </h3>
          <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
            screening vans · SMS · CHW visits — top 8 parishes by unmet need
          </span>
          <button
            type="button"
            onClick={() => {
              if (tourStop != null) {
                setTourStop(null)
                toast('Van tour stopped.')
              } else {
                setTourLog([])
                setTourStop(0)
              }
            }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            {tourStop != null ? '⏹ Stop tour' : '🚐 Deploy van to top-10'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {top8.map((p) => {
                const a = outreachAction(p)
                return (
                  <tr key={p.n}>
                    <td className="border-b border-border px-3 py-3">
                      <b className="text-card-foreground">
                        {p.rank}. {p.n} Parish
                      </b>
                      <div className="text-xs text-muted-foreground">
                        {p.late == null ? 'late-stage suppressed' : `${p.late}% late-stage`} · {p.cov}%
                        screened
                      </div>
                    </td>
                    <td className="border-b border-border px-3 py-3 text-muted-foreground">
                      <span className="block text-xs">Unscreened</span>
                      <b className="text-card-foreground">{p.uns.toLocaleString()}</b>
                    </td>
                    <td className="border-b border-border px-3 py-3 text-muted-foreground">
                      <span className="block text-xs">Coverage gap</span>
                      <b className="text-card-foreground">{(100 - p.cov).toFixed(0)}%</b>
                    </td>
                    <td className="border-b border-border px-3 py-3 text-right">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', TONE[a.tone])}>
                        {a.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------- follow-up + FIT kits */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FollowQueue selected={selected} />
        <FitTracking selected={selected} />
      </div>

      {/*
        The geographic map's hover panel.
        Fixed-position rather than absolute so it follows the cursor and is never
        clipped by the map's scroll container. `pointer-events-none` matters: the
        node sits under the cursor, and without it the tooltip would steal the
        mouseleave from the path beneath and flicker.
      */}
      {tip && tipParish && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 w-[262px] rounded-lg border border-border bg-card p-3 text-xs shadow-[var(--shadow-lg)]"
          style={{
            left: Math.min(tip.x + 14, window.innerWidth - 275),
            top: Math.min(tip.y + 14, window.innerHeight - 210),
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-card-foreground">{tipParish.n} Parish</b>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-bold',
                tipParish.rank == null
                  ? 'bg-muted text-muted-foreground'
                  : tipParish.rank <= 10
                    ? 'bg-danger-bg text-danger-fg'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {tipParish.rank == null ? 'late-stage data suppressed' : `#${tipParish.rank} unmet need`}
            </span>
          </div>

          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
            {(
              [
                ['Population', tipParish.pop.toLocaleString()],
                ['Incidence /100k', String(tipParish.inc)],
                ['Late-stage share', tipParish.late == null ? 'suppressed' : `${tipParish.late}%`],
                ['Screening coverage', `${tipParish.cov}%`],
                ['Eligible & unscreened', `≈ ${tipParish.uns.toLocaleString()}`],
                ['Need index', tipParish.need == null ? '—' : tipParish.need.toFixed(1)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-bold text-card-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

function FollowQueue({ selected }: { selected: ParishRow | null }) {
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)
  const scope = selected ? [selected] : top8
  const totals = scope.reduce(
    (acc, p) => {
      const f = parishResults(p)
      acc.abnormal += f.abnormal
      acc.overdue += f.overdue
      return acc
    },
    { abnormal: 0, overdue: 0 },
  )

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">
          📞 14-day abnormal-result follow-up queue
        </h3>
        <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
          Rank 4 extension · brief area 4
        </span>
      </div>

      <p className="text-sm text-card-foreground">
        {selected
          ? `Scoped to ${selected.n} Parish — ${totals.abnormal} abnormal results in the window.`
          : `Top 8 parishes — ${totals.abnormal} abnormal results, ${totals.overdue} past the 14-day window.`}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {scope.map((p) => {
          const f = parishResults(p)
          const a = followAction(f)
          return (
            <div key={p.n} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
              <div className="min-w-0 flex-1">
                <b className="text-sm text-card-foreground">{p.n}</b>
                <div className="text-xs text-muted-foreground">
                  {f.abnormal} abnormal · {f.overdue} overdue · {f.lag}-day lag
                </div>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', TONE[a.tone])}>
                {a.label}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Screening only helps if an abnormal result actually gets followed up. This queue comes from
        the same parish need model — pick any parish on the map or the tiles to re-scope it.
      </p>
    </section>
  )
}

function FitTracking({ selected }: { selected: ParishRow | null }) {
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)
  const scope = selected ? [selected] : top8

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">🧫 FIT kit return tracking</h3>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
          mailed stool kits · {selected ? selected.n : 'top 8 parishes'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {scope.map((p) => {
          const f = parishResults(p)
          const pct = Math.round(f.fitRate * 100)
          return (
            <div key={p.n} className="flex items-center gap-3">
              <span className="w-28 flex-none truncate text-sm text-card-foreground">{p.n}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct < 40 ? 'bg-danger' : pct < 55 ? 'bg-warning' : 'bg-brand-500',
                  )}
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="w-24 flex-none text-right text-xs text-muted-foreground">
                {f.fitBack.toLocaleString()}/{f.fitSent.toLocaleString()} · {pct}%
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        FIT kits need no appointment and no bowel prep — for a rural patient that is often the
        difference between screened and not. The return rate drives the escalation in the queue
        beside it.
      </p>
    </section>
  )
}
