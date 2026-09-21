import { cn } from '@/lib/utils'
import type { FiredRule } from '@/engine/survivorship/lateRules'

const C = 110
const R = 92

/** Polar to cartesian, matching the legacy spoke maths exactly. */
function px(ang: number, r: number): [number, number] {
  return [C + Math.cos((ang * Math.PI) / 180) * r, C + Math.sin((ang * Math.PI) / 180) * r]
}

/**
 * The late-effects radar.
 *
 * Ported as-is rather than replaced with a charting library: it is not a radar
 * chart in the recharts sense. Each spoke's RADIUS encodes the triage tier and
 * each is a filled arc segment with its own opacity, keyed to the selection.
 * No library has that primitive, and swapping one in would lose the exact
 * visual for a day of fighting the API.
 *
 * Accessibility: the legacy put onclick on <path> and <circle>, which are not
 * focusable and cannot be reached by keyboard at all. Each spoke is a real
 * focusable control here, with the same handler on Enter and Space — and the
 * spoke list beside it carries the same information in text, which is what a
 * screen reader actually reads.
 */
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

  const n = hits.length

  return (
    <svg
      viewBox="0 0 220 240"
      className="h-[245px] w-[225px] flex-none"
      role="group"
      aria-label="Late-effects radar"
    >
      {[30, 62, R].map((r, i) => (
        <circle
          key={r}
          cx={C}
          cy={C}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1.5}
          strokeDasharray={i === 2 ? undefined : '3 4'}
        />
      ))}

      {hits.map((h, i) => {
        const a = -90 + (i * 360) / n
        const rDot = 20 + h.hit.t * 22
        const p1 = px(a - 0.14, 18)
        const p2 = px(a - 0.14, rDot)
        const p3 = px(a + 0.14, rDot)
        const p4 = px(a + 0.14, 18)
        const dot = px(a, rDot)
        const tip = px(a, R)
        const lb = px(a, 98)
        const isSel = selected === h.cat

        const activate = () => onSelect(isSel ? null : h.cat)

        return (
          <g key={h.cat}>
            <path
              d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} A ${rDot} ${rDot} 0 0 1 ${p3[0]} ${p3[1]} L ${p4[0]} ${p4[1]} A 18 18 0 0 0 ${p1[0]} ${p1[1]}`}
              fill={`var(--${h.color})`}
              opacity={isSel ? 0.5 : 0.28}
              stroke={`var(--${h.color})`}
              strokeWidth={1.2}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${h.cat}, ${h.hit.test}`}
              aria-pressed={isSel}
              onClick={activate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  activate()
                }
              }}
            />
            <circle
              cx={dot[0]}
              cy={dot[1]}
              r={5}
              fill={`var(--${h.color})`}
              stroke="var(--card)"
              strokeWidth={1.5}
              className="cursor-pointer"
              aria-hidden="true"
              onClick={activate}
            />
            <line
              x1={dot[0]}
              y1={dot[1]}
              x2={tip[0]}
              y2={tip[1]}
              stroke={`var(--${h.color})`}
              strokeWidth={1.2}
              opacity={0.35}
            />
            <text
              x={lb[0]}
              y={lb[1]}
              fontSize={9.5}
              fontWeight={700}
              fill="var(--ink)"
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn('pointer-events-none select-none')}
            >
              {h.short}
            </text>
          </g>
        )
      })}

      <text
        x={C}
        y={C - 4}
        fontSize={12.5}
        fontWeight={800}
        fill="var(--green-600)"
        textAnchor="middle"
      >
        LATE-EFFECTS
      </text>
      <text x={C} y={C + 11} fontSize={9.5} fontWeight={700} fill="var(--ink-soft)" textAnchor="middle">
        RADAR
      </text>
    </svg>
  )
}
