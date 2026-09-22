import { Activity } from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { motion, useReducedMotion } from 'framer-motion'

import { EmptyState } from '@/components/shared/EmptyState'
import type { FiredRule } from '@/engine/survivorship/lateRules'
import { fadeIn, transitionNormal } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * The late-effects radar, on Recharts.
 *
 * WHAT THE VALUES ARE, because this is the thing most likely to be misread:
 * each spoke's value is `hit.t` — a TRIAGE TIER of 1-3, not a 0-100 score.
 * Tier 3 is the HIGHEST clinical priority, not the "strongest" result. The
 * domain is pinned to [0, 3] so the axis cannot be rescaled to the data and
 * make a tier-1 and a tier-3 look alike.
 *
 * Always the same radar plot — even with 1–2 fired rules (Marcus). A thin
 * polygon is still the shared visual language; swapping to bars made the
 * Survivorship card look like two different products depending on the demo
 * survivor.
 *
 * Accessibility: the chart is decorative-with-a-text-alternative, not the only
 * route to the data. A visible value list and an sr-only detail list carry
 * every category and tier, and the Survivorship card beside this also renders
 * interactive category buttons — so nothing depends on reading geometry alone.
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

/** Popover-styled tooltip — BayouCare tokens, not Recharts defaults. */
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
    <div
      role="status"
      className="rounded-md border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-[var(--shadow-lg)]"
    >
      <p className="text-sm font-semibold text-popover-foreground">{r.cat}</p>
      <p className="mt-1 typo-metric text-base leading-none">
        {r.tier}
        <span className="text-sm font-normal text-muted-foreground"> / {MAX_TIER}</span>
      </p>
      <p className="mt-1 text-xs font-semibold text-card-foreground">
        {TIER_LABEL[r.tier] ?? '—'}
      </p>
      <p className="mt-1.5 max-w-[220px] text-xs leading-snug text-muted-foreground">
        {r.test} · {r.freq}
      </p>
    </div>
  )
}

function RadarPlot({
  rows,
  selected,
  onSelect,
}: {
  rows: Row[]
  selected: string | null
  onSelect: (cat: string | null) => void
}) {
  return (
    <div className="mx-auto aspect-square w-full max-w-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        {/*
          `outerRadius` is 52%, not the usual 70-75%, and that is measured
          rather than aesthetic. Recharts places the category labels OUTSIDE
          the plot, so the radius and the labels compete for the same box.
          52% stays clean across 293 / 310 / 320px — the sizes actually rendered.
        */}
        <RadarChart data={rows} outerRadius="52%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke="var(--line)" strokeOpacity={0.85} />
          <PolarAngleAxis
            dataKey="short"
            tick={{
              fill: 'var(--ink-soft)',
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, MAX_TIER]}
            tickCount={MAX_TIER + 1}
            tick={{ fill: 'var(--ink-soft)', fontSize: 11 }}
            axisLine={false}
          />
          <Radar
            name="Late-effect tier"
            dataKey="tier"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="var(--primary)"
            fillOpacity={0.16}
            isAnimationActive={!prefersReducedMotion()}
            animationDuration={280}
            dot={{ r: 3.5, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
            onClick={(e) => {
              const cat = (e as unknown as { payload?: Row })?.payload?.cat
              if (cat) onSelect(selected === cat ? null : cat)
            }}
          />
          <Tooltip content={<RadarTip />} cursor={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LateEffectsRadar({
  hits,
  selected,
  onSelect,
  className,
}: {
  hits: FiredRule[]
  selected: string | null
  onSelect: (cat: string | null) => void
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (!hits.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No late-effect rules yet"
        description="No surveillance rules triggered for this treatment record. Pick another demo survivor, or review the treatment summary."
        className={className}
      />
    )
  }

  const rows = toRows(hits)

  // Risk framing, not wellness framing: the highest tier is the one to act on
  // first. Comparisons only — no clinical judgement beyond the encoded tiers.
  const top = rows.reduce((a, b) => (b.tier > a.tier ? b : a), rows[0])
  const low = rows.reduce((a, b) => (b.tier < a.tier ? b : a), rows[0])
  const avg = rows.reduce((sum, r) => sum + r.tier, 0) / rows.length

  return (
    <motion.div
      className={cn('flex flex-col gap-4', className)}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      variants={fadeIn}
      transition={transitionNormal}
    >
      <RadarPlot rows={rows} selected={selected} onSelect={onSelect} />

      {/* Human-readable summary derived from the same tiers — not diagnoses. */}
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="typo-meta">Act on first</dt>
          <dd className="mt-0.5 text-sm font-semibold text-card-foreground">
            {top.cat}
            <span className="font-normal text-muted-foreground"> · tier {top.tier}</span>
          </dd>
        </div>
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="typo-meta">Routine</dt>
          <dd className="mt-0.5 text-sm font-semibold text-card-foreground">
            {low.cat}
            <span className="font-normal text-muted-foreground"> · tier {low.tier}</span>
          </dd>
        </div>
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="typo-meta">Average tier</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-card-foreground">
            {avg.toFixed(1)}
            <span className="font-normal text-muted-foreground"> / {MAX_TIER}</span>
          </dd>
        </div>
      </dl>

      {/* Visible exact values — complements the interactive list on Survivorship. */}
      <ul className="divide-y divide-border rounded-md border border-border" aria-label="Late-effect tiers by category">
        {rows.map((r) => (
          <li key={r.cat} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 font-medium text-card-foreground">{r.cat}</span>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              <span className="font-semibold text-card-foreground">
                {r.tier}
                <span className="font-normal text-muted-foreground"> / {MAX_TIER}</span>
              </span>
              <span className="typo-meta w-14 text-right">{TIER_LABEL[r.tier]}</span>
            </span>
          </li>
        ))}
      </ul>

      {/*
        Screen-reader backup with the extra test/frequency detail the visible
        list omits. A list (not a <table>) — wide fixed-layout tables still
        inflate document scrollWidth in Chromium even inside overflow-clipped
        sr-only wrappers.
      */}
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.cat}>
            {r.cat}: tier {r.tier} of {MAX_TIER}, {TIER_LABEL[r.tier] ?? '—'}, {r.test}, {r.freq}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

/** Recharts animates via SVG attributes, which the CSS rule cannot reach. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
