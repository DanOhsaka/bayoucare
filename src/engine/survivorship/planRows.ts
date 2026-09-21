import { SURVIVORS, type Survivor } from '@/data'
import { DEMO_TODAY } from '@/lib/demoClock'
import {
  LATE_RULES,
  ruleFind,
  type Exposure,
  type FiredRule,
  type LateHit,
} from '@/engine/survivorship/lateRules'

const monthOf = (ym: string) => {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1)
}

export type RowStatus = 'over' | 'soon' | 'on' | 'doc'

export interface PlanRow {
  test: string
  freq: string
  due: string
  status: RowStatus
  cat?: string
  note?: string
  tier?: number
}

/**
 * Turn the fired rules into surveillance rows.
 *
 * Reproduced from the legacy app. The two baseline rows are always present and
 * the rule-derived rows carry the interval, the next-due year and a status that
 * `statusChip` turns into a badge. A pre-existing "done" override (`s.od`)
 * wins over the computed schedule, because a recorded result beats a projection.
 */
export function buildRows(s: Survivor, hits: FiredRule[]): PlanRow[] {
  const endY = +s.endDate.slice(-4)

  const rows: PlanRow[] = [
    { test: 'Oncology follow-up visit', freq: 'every 6 months ×2, then annual', due: 'ongoing', status: 'on' },
    { test: 'PCP handoff — annual wellness visit', freq: 'annual', due: 'ongoing', status: 'on' },
  ]

  const freqY: Record<string, number> = {
    annual: 1,
    'every 2 years': 2,
    'every 3 years': 3,
    '5 years': 5,
    once: 99,
  }

  hits.forEach((h) => {
    const fy = freqY[h.hit.freq] || 2
    const startY = endY + (h.hit.start || 0)
    let dueTxt: string
    let status: RowStatus

    if (fy === 99) {
      dueTxt = 'documented'
      status = 'doc'
    } else {
      const elapsed = DEMO_TODAY.getFullYear() - startY
      const dueY = startY + Math.max(1, Math.ceil(elapsed / fy)) * fy
      dueTxt = String(dueY)
      status = dueY - DEMO_TODAY.getFullYear() <= 1 ? 'soon' : 'on'
    }

    const override = s.od?.[h.cat]
    if (override) {
      dueTxt = override
      status = monthOf(override) < DEMO_TODAY ? 'over' : 'soon'
    }

    rows.push({
      test: h.hit.test,
      freq: h.hit.freq,
      due: dueTxt,
      status,
      cat: h.cat,
      note: h.hit.note,
      tier: h.hit.t,
    })
  })

  return rows
}

/** A badge descriptor — the legacy returned HTML; React renders these instead. */
export function statusChip(r: PlanRow): { label: string; kind: 'danger' | 'warning' | 'success' | 'neutral' } {
  switch (r.status) {
    case 'over':
      return { label: 'Overdue — schedule now', kind: 'danger' }
    case 'soon':
      return { label: `Due ${r.due}`, kind: 'warning' }
    case 'doc':
      return { label: 'Documented', kind: 'neutral' }
    default:
      return { label: r.due === 'ongoing' ? 'Ongoing' : `Due ${r.due}`, kind: 'success' }
  }
}

export interface ScpModel {
  s: Survivor
  hits: FiredRule[]
  rows: PlanRow[]
}

/**
 * Build the care plan for a survivorship record.
 *
 * The guard is load-bearing, not defensive padding: every caller reaches
 * `ruleFind(s.e)` and `s` is undefined for any id with no SURVIVORS entry —
 * which is EVERY patient still in active treatment.
 */
export function scpModel(id: string | null | undefined): ScpModel | null {
  if (!id) return null
  const s = SURVIVORS[id]
  if (!s) return null
  const hits = ruleFind(s.e as unknown as Exposure)
  return { s, hits, rows: buildRows(s, hits) }
}

export { LATE_RULES }
export type { Exposure, LateHit }
