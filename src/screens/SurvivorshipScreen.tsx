import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LateEffectsRadar } from '@/components/shared/LateEffectsRadar'
import { RichText } from '@/components/shared/RichText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SURVIVOR_IDS } from '@/data'
import { buildLetter } from '@/engine/survivorship/letter'
import { scpModel, statusChip } from '@/engine/survivorship/planRows'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/** Chip labels, in the order the legacy listed them. */
const CHIP_LABEL: Record<string, string> = {
  yolanda: 'Yolanda · breast, 2019',
  marcus: 'Marcus · lymphoma, 2021',
  alicia: 'Alicia · Hodgkin, 2016',
  earl: 'Earl · prostate, 2020',
}

const TIER_TEXT: Record<number, string> = { 1: 'Low', 2: 'Moderate', 3: 'High' }

/** Late-effect tier → the `Badge` variant that owns its colour pair. */
const TIER_VARIANT: Record<number, 'success' | 'warning' | 'danger'> = {
  1: 'success',
  2: 'warning',
  3: 'danger',
}

export function SurvivorshipScreen() {
  const [survSel, setSurvSel] = useState('yolanda')
  const [radarSel, setRadarSel] = useState<string | null>(null)
  const setCaregiver = useUi((s) => s.setCaregiver)

  const model = useMemo(() => scpModel(survSel), [survSel])

  /*
   * The admin generator's picker is deliberately NOT wired to the patient's own
   * plan. In the legacy app, re-rendering the patient tab from this selection is
   * what made the patient's view follow the clinician's choice — a patient was
   * shown a stranger's chart. The patient's plan is bound to their own record
   * and only changes when the logged-in patient does.
   */
  function pick(id: string) {
    setSurvSel(id)
    setRadarSel(null)
  }

  if (!model) return null
  const { s, hits, rows } = model

  const detail = radarSel ? hits.find((h) => h.cat === radarSel) : null
  const detailRow = radarSel ? rows.find((r) => r.cat === radarSel) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📋 Survivorship Care Plans — auto-generated, ASCO format
          </CardTitle>
          <Badge variant="success" className="text-left whitespace-normal">
            ~350,000 LA survivors · the largest population the brief names
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Every survivor gets an ASCO-style care plan from their treatment record —{' '}
            <b className="text-card-foreground">summary + follow-up plan + PCP letter, in seconds</b> —
            plus a <b className="text-card-foreground">late-effects radar</b> that turns "doxorubicin +
            chest radiation" into a concrete surveillance schedule. Pick a demo survivor:
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {SURVIVOR_IDS.map((id) => (
              <Button
                key={id}
                type="button"
                size="xs"
                variant={survSel === id ? 'default' : 'outline'}
                aria-pressed={survSel === id}
                onClick={() => pick(id)}
                className="rounded-full px-2.5 font-bold"
              >
                {CHIP_LABEL[id] ?? id}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* ------------------------------------------------------- summary */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              {s.name} · {s.age}
            </CardTitle>
            <Badge variant="success">
              MRN {s.mrn} · {s.parish} Parish
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <b className="text-card-foreground">{s.dx}</b>
              <br />
              Diagnosed {s.dxDate} · treatment completed {s.endDate} · survivorship since{' '}
              {s.survivorSince}
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                      Treatment summary (ASCO SCP Section 1)
                    </th>
                    <th className="border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                      Dates
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {s.treatments.map(([t, d], i) => (
                    <tr key={i}>
                      <td className="border-b border-border px-3 py-2.5 text-card-foreground">{t}</td>
                      <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Auto-generated from the treatment record — no typing. Reviewed at the survivorship clinic
              visit.
            </p>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------- radar */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>🛰️ Late-effects radar</CardTitle>
            <Badge variant="warning">{hits.length} active risk rules · treatment-driven</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-start gap-4">
              <LateEffectsRadar hits={hits} selected={radarSel} onSelect={setRadarSel} />

              <div className="min-w-[200px] flex-1">
                <div className="flex flex-col gap-1.5">
                  {hits.map((h) => (
                    <Button
                      key={h.cat}
                      type="button"
                      variant="outline"
                      aria-pressed={radarSel === h.cat}
                      onClick={() => setRadarSel(radarSel === h.cat ? null : h.cat)}
                      className={cn(
                        'h-auto flex-col items-start gap-0 px-3 py-2 text-left font-normal whitespace-normal',
                        radarSel === h.cat && 'border-brand-600 bg-accent',
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <b className="text-sm text-card-foreground">{h.cat}</b>
                        <Badge variant={TIER_VARIANT[h.hit.t] ?? 'success'}>
                          {TIER_TEXT[h.hit.t]} risk
                        </Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {h.hit.test} · {h.hit.freq}
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="mt-2.5 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  {radarSel && detail && detailRow ? (
                    <>
                      <b className="text-card-foreground">
                        {detail.cat} — {TIER_TEXT[detail.hit.t]} risk
                      </b>{' '}
                      {(() => {
                        const c = statusChip(detailRow)
                        return <Badge variant={c.kind}>{c.label}</Badge>
                      })()}
                      <br />
                      {detail.hit.note}
                    </>
                  ) : (
                    'Click a spoke for the surveillance detail.'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/*
        `lg`, not `md`: this pair is a four-column data table and a page-width
        letter. Two columns at 768–1023 left the table 336px against the 397px it
        needs, so it scrolled sideways inside its own card — the one thing a
        tablet reader cannot discover. Full width until there is room for two.
      */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------------ schedule */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Follow-up care plan</CardTitle>
            <Badge variant="success">ASCO SCP Section 2</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {['Test / visit', 'Frequency', 'Next due', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const c = statusChip(r)
                    return (
                      <tr key={i}>
                        <td className="border-b border-border px-3 py-2.5 text-card-foreground">{r.test}</td>
                        <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.freq}</td>
                        <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.due}</td>
                        <td className="border-b border-border px-3 py-2.5">
                          <Badge variant={c.kind}>{c.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* -------------------------------------------------------- letter */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>PCP handoff letter</CardTitle>
            <CardAction>
              <Button
                type="button"
                size="xs"
                onClick={() => window.print()}
                className="font-bold"
              >
                🖨️ Print SCP
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => toast('📨 SCP sent to the PCP clinic via secure fax + portal.')}
                className="font-bold"
              >
                Share with PCP
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                /*
                 * This said "caregiver mode updated" and updated nothing — the
                 * handler was the toast alone, so the button announced a change
                 * it never made. Caregiver mode is real persisted state now, so
                 * the claim is made true rather than deleted: turning it on is
                 * what "share with family" means for this device.
                 */
                onClick={() => {
                  setCaregiver(true)
                  toast('👨‍👩‍👧 Care plan shared with family circle — caregiver mode is on.')
                }}
                className="font-bold"
              >
                Share with family
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {/* Authored prose with inline emphasis, built here from the app's own
                data — the same rendering path as the plan's Markdown-free letter. */}
            <RichText
              html={buildLetter(s, hits)}
              className="block whitespace-pre-line text-sm leading-relaxed text-card-foreground"
            />

            <p className="mt-3 text-xs text-muted-foreground">
              AI draft from the treatment record — reviewed and signed by the survivorship nurse
              navigator at the clinic visit. Demo survivors are synthetic records modeled on ASCO SCP
              templates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
