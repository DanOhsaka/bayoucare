import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { FiredRule } from '@/engine/survivorship/lateRules'

/**
 * The late-effects radar, on Recharts.
 *
 * WHAT THE VALUES ARE, because this is the thing most likely to be misread:
 * each spoke's value is `hit.t` — a TRIAGE TIER of 1-3, not a 0-100 score.
 * Tier 3 is the HIGHEST clinical priority, not the "strongest" result. The
 * domain is pinned to [0, 3] so the axis cannot be rescaled to the data and
 * make a tier-1 and a tier-3 look alike.
 *
 * This replaced a hand-rolled SVG version. The trade was deliberate and worth
 * stating: the old one drew each spoke as an arc WEDGE filling out to its tier
 * radius, which no charting library expresses as a primitive. What is gained
 * here is responsive sizing, a real tooltip, and a simpler surface to keep
 * legible. What is lost is that wedge shape.
 *
 * Accessibility: the chart is decorative-with-a-text-alternative, not the only
 * route to the data. A visually hidden table carries every category and tier,
 * and the card beside this renders the same list in visible text with a risk
 * label each — so nothing here depends on reading geometry, or on colour.
 */

const MAX_TIER = 3

const TIER_LABEL: Record<number, string> = {
  1: 'Routine',
  2: 'Monitor',
  3: 'Priority',
}

interface Row {
  cat: string
  short: string
  tier: number
  tone: string
  test: string
  freq: string
}

function toRows(hits: FiredRule[]): Row[] {
  return hits.map((h) => ({
    cat: h.cat,
    short: h.short,
    tier: h.hit.t,
    tone: h.color,
    test: h.hit.test,
    freq: h.hit.freq,
  }))
}

/** Styled to the app's popover idiom rather than Recharts' default box. */
function RadarTip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: Row }>
}) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[var(--shadow-lg)]">
      <b className="block font-semibold">{r.cat}</b>
      <span className="mt-0.5 block text-muted-foreground">
        {r.test} · {r.freq}
      </span>
      <span className="mt-1 block font-bold text-card-foreground">
        Tier {r.tier} of {MAX_TIER} · {TIER_LABEL[r.tier] ?? '—'}
      </span>
    </div>
  )
}

export function LateEffectsRadar({
  hits,
  selected,
  onSelect,
}: {
  hits: FiredRule[]
  selected: string | null
  onSelect: (cat: string | null) => void
}) {
  if (!hits.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No late-effect rules triggered for this treatment record.
      </p>
    )
  }

  const rows = toRows(hits)

  // Risk framing, not wellness framing: the highest tier is the one to act on
  // first, so calling it the "strongest area" would say the opposite of the
  // truth. Both are plain comparisons over the values, no clinical judgement.
  const top = rows.reduce((a, b) => (b.tier > a.tier ? b : a), rows[0])
  const low = rows.reduce((a, b) => (b.tier < a.tier ? b : a), rows[0])

  return (
    <div className="flex flex-col gap-3">
      {/*
        SQUARE, deliberately. A radar's radius is capped by the SHORTER side, so
        a wide-but-short box shrinks the plot while the category labels still
        need their full width — which is exactly how "2nd cancer" got clipped at
        375px. Matching the two gives the labels their room and the plot its
        size at every width.
      */}
      <div className="mx-auto aspect-square w-full max-w-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {/*
            `outerRadius` is 52%, not the usual 70-75%, and that is measured
            rather than aesthetic. Recharts places the category labels OUTSIDE
            the plot, so the radius and the labels compete for the same box:

              70%  "2nd cancer" overflowed by 18px, "Cognitive" by 7px — everywhere
              58%  clean at 320px, still touching the edge at 293px (375px viewport)
              52%  clean across 293 / 310 / 320px — the sizes actually rendered

            The box is 293px at its smallest (a 375px phone inside the card's
            padding), and the label is wider than the margin left for it. Shaving
            the radius is cheaper than shrinking the text: the brief is explicit
            that labels stay legible rather than being squeezed to fit.
          */}
          <RadarChart data={rows} outerRadius="52%" margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <PolarGrid stroke="var(--line)" />
            <PolarAngleAxis
              dataKey="short"
              tick={{ fill: 'var(--ink-soft)', fontSize: 12, fontWeight: 600 }}
            />
            {/*
              Pinned domain — see the note at the top of the file. `angle={90}`
              puts the ticks straight up the vertical instead of on the diagonal,
              which is where Recharts puts them by default and where they cut
              across the polygon as clutter.
            */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, MAX_TIER]}
              tickCount={MAX_TIER + 1}
              tick={{ fill: 'var(--ink-soft)', fontSize: 11 }}
            />
            <Radar
              name="Late-effect tier"
              dataKey="tier"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="var(--primary)"
              fillOpacity={0.18}
              // Recharts animates the polygon in on mount. The global
              // reduced-motion rule neutralises CSS animation but not this,
              // which is SVG-attribute driven, so it is switched off here and
              // the rule is honoured explicitly.
              isAnimationActive={!prefersReducedMotion()}
              animationDuration={280}
              dot={{ r: 3, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
              /*
               * Recharts types onClick as a plain SVG mouse handler, but passes
               * the clicked data point alongside the event at runtime. The cast
               * is deliberate and guarded — if the shape ever changes, the
               * optional chain leaves the click a no-op rather than throwing.
               * The adjacent list remains the fully keyboard-accessible route
               * to the same selection either way.
               */
              onClick={(e) => {
                const cat = (e as unknown as { payload?: Row })?.payload?.cat
                if (cat) onSelect(selected === cat ? null : cat)
              }}
            />
            <Tooltip content={<RadarTip />} cursor={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* A compact read of the same numbers, so the shape is never the only way
          to get them — and so it still works at a glance on a phone. */}
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">Act on first</dt>
          <dd className="font-bold text-card-foreground">
            {top.cat} · tier {top.tier}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">Routine</dt>
          <dd className="font-bold text-card-foreground">
            {low.cat} · tier {low.tier}
          </dd>
        </div>
      </dl>

      {/*
        The text alternative. Visually hidden, because the card beside this
        renders the same content; present so the chart is never the sole source
        of a value for a screen reader.

        `sr-only` goes on this WRAPPER, not on the <table>. On a table it does
        not clip: `overflow: hidden` does not contain a table box the way it
        contains a block, so the 693px-wide table escaped a 375px viewport and
        dragged the whole page 358px sideways. A div is a block container, so
        the clip applies.
      */}
      <div className="sr-only">
        <table>
          <caption>Late-effects surveillance, by category</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Tier</th>
              <th scope="col">Priority</th>
              <th scope="col">Test</th>
              <th scope="col">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cat}>
                <th scope="row">{r.cat}</th>
                <td>{r.tier}</td>
                <td>{TIER_LABEL[r.tier] ?? '—'}</td>
                <td>{r.test}</td>
                <td>{r.freq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Recharts animates via SVG attributes, which the CSS rule cannot reach. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
