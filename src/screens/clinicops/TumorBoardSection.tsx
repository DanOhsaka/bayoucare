import { toast } from 'sonner'

import { RichText } from '@/components/shared/RichText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildMDT, tbCase, TB_IDS, type TbModel } from '@/engine/clinic/tumorBoard'
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
    toast('Board packet circulated to the 7 attendees — questions assigned.')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tumor-Board Prep</CardTitle>
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
              <Button
                key={id}
                type="button"
                size="xs"
                variant={tbId === id ? 'default' : 'outline'}
                aria-pressed={tbId === id}
                onClick={() =>setTbId(id)}
                className="rounded-full px-2.5 font-bold"
              >
                {t.name}
              </Button>
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
              <Button
                type="button"
                size="xs"
                variant={circulated ? 'outline' : 'default'}
                onClick={circulate}
                className="font-bold"
              >
                {circulated ? 'Circulated ✓' : 'Circulate to board'}
              </Button>
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
