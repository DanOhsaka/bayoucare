import { toast } from 'sonner'

import { RichText } from '@/components/shared/RichText'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildMDT, tbCase, TB_IDS, type TbModel } from '@/engine/clinic/tumorBoard'
import { cn } from '@/lib/utils'
import { useClinic } from '@/store/clinic'

/**
 * Rank 10 — tumor-board prep.
 *
 * Two cards: the picker, and the MDT case summary the board reads. Selection
 * lives in the clinic store (`tbId`) rather than local state, so the header
 * chips, the letter and any sibling Clinic Ops surface stay on one case.
 *
 * Clinical content is not authored here — `buildMDT` carries the legacy's
 * staging, markers, AJCC edition and open questions verbatim, and pulls the
 * late-effects list from the real survivorship engine.
 */

/** Every case that resolves, in `TB_CASES` order — the picker's source. */
const CASES = TB_IDS.map((id) => ({ id, t: tbCase(id) })).filter(
  (x): x is { id: string; t: TbModel } => x.t !== null,
)

export function TumorBoardSection() {
  const tbId = useClinic((s) => s.tbId)
  const setTbId = useClinic((s) => s.setTbId)
  const tbCirculated = useClinic((s) => s.tbCirculated)
  const circulateTb = useClinic((s) => s.circulateTb)

  const selected = CASES.find((x) => x.id === tbId) ?? null
  const circulated = tbCirculated.has(tbId)

  function circulate() {
    circulateTb(tbId)
    toast('📋 Board packet circulated to the 7 attendees — questions assigned.')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Tumor-Board Prep</CardTitle>
          <Badge variant="warning">Rank 10 · brief area 5</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Staging, molecular markers, treatment history and the open questions — assembled from the
            record before the board meets, with late-effects surveillance carried in from the
            survivorship engine.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {CASES.map(({ id, t }) => (
              <button
                key={id}
                type="button"
                aria-pressed={tbId === id}
                onClick={() => setTbId(id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  tbId === id
                    ? 'border-brand-600 bg-brand-700 text-on-dark'
                    : 'border-border bg-background text-foreground hover:bg-accent',
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>MDT case summary</CardTitle>
            <CardAction>
              <Badge variant="success">{selected.t.c.ajcc.stage}</Badge>
              <Badge variant="neutral">{selected.t.c.ajcc.ed}</Badge>
              <Badge variant="warning">
                {`${selected.t.hits.length} late-effect ${
                  selected.t.hits.length === 1 ? 'rule' : 'rules'
                } flagged`}
              </Badge>
              <button
                type="button"
                onClick={circulate}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                  circulated
                    ? 'border border-border text-foreground hover:bg-background'
                    : 'bg-primary text-primary-foreground',
                )}
              >
                {circulated ? 'Circulated ✓' : '📤 Circulate to board'}
              </button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {/* Authored prose with inline emphasis, built here from the app's own
                data — the same rendering path as the survivorship letter. */}
            <RichText
              html={buildMDT(selected.t)}
              className="block whitespace-pre-line rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-card-foreground"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
