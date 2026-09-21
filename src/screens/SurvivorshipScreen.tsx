import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LateEffectsRadar } from '@/components/shared/LateEffectsRadar'
import { RichText } from '@/components/shared/RichText'
import { SURVIVOR_IDS } from '@/data'
import { buildLetter } from '@/engine/survivorship/letter'
import { scpModel, statusChip } from '@/engine/survivorship/planRows'
import { cn } from '@/lib/utils'

/** Chip labels, in the order the legacy listed them. */
const CHIP_LABEL: Record<string, string> = {
  yolanda: 'Yolanda · breast, 2019',
  marcus: 'Marcus · lymphoma, 2021',
  alicia: 'Alicia · Hodgkin, 2016',
  earl: 'Earl · prostate, 2020',
}

const TIER_TEXT: Record<number, string> = { 1: 'Low', 2: 'Moderate', 3: 'High' }
const TIER_CHIP: Record<number, string> = {
  1: 'bg-success-bg text-success-fg',
  2: 'bg-warning-bg text-warning-fg',
  3: 'bg-danger-bg text-danger-fg',
}

const STATUS_CHIP: Record<string, string> = {
  danger: 'bg-danger-bg text-danger-fg',
  warning: 'bg-warning-bg text-warning-fg',
  success: 'bg-success-bg text-success-fg',
  neutral: 'bg-muted text-muted-foreground',
}

export function SurvivorshipScreen() {
  const [survSel, setSurvSel] = useState('yolanda')
  const [radarSel, setRadarSel] = useState<string | null>(null)

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
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">
            📋 Survivorship Care Plans — auto-generated, ASCO format
          </h3>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            ~350,000 LA survivors · the largest population the brief names
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Every survivor gets an ASCO-style care plan from their treatment record —{' '}
          <b className="text-card-foreground">summary + follow-up plan + PCP letter, in seconds</b> —
          plus a <b className="text-card-foreground">late-effects radar</b> that turns "doxorubicin +
          chest radiation" into a concrete surveillance schedule. Pick a demo survivor:
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {SURVIVOR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={survSel === id}
              onClick={() => pick(id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                survSel === id
                  ? 'border-brand-600 bg-brand-700 text-on-dark'
                  : 'border-border bg-background text-foreground hover:bg-accent',
              )}
            >
              {CHIP_LABEL[id] ?? id}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* ------------------------------------------------------- summary */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-card-foreground">
              {s.name} · {s.age}
            </h3>
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
              MRN {s.mrn} · {s.parish} Parish
            </span>
          </div>

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
        </section>

        {/* ---------------------------------------------------------- radar */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-card-foreground">🛰️ Late-effects radar</h3>
            <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
              {hits.length} active risk rules · treatment-driven
            </span>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <LateEffectsRadar hits={hits} selected={radarSel} onSelect={setRadarSel} />

            <div className="min-w-[200px] flex-1">
              <div className="flex flex-col gap-1.5">
                {hits.map((h) => (
                  <button
                    key={h.cat}
                    type="button"
                    aria-pressed={radarSel === h.cat}
                    onClick={() => setRadarSel(radarSel === h.cat ? null : h.cat)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left transition-colors',
                      radarSel === h.cat
                        ? 'border-brand-600 bg-accent'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-sm text-card-foreground">{h.cat}</b>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-bold',
                          TIER_CHIP[h.hit.t] ?? TIER_CHIP[1],
                        )}
                      >
                        {TIER_TEXT[h.hit.t]} risk
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {h.hit.test} · {h.hit.freq}
                    </span>
                  </button>
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
                      return (
                        <span
                          className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_CHIP[c.kind])}
                        >
                          {c.label}
                        </span>
                      )
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
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* ------------------------------------------------------ schedule */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-card-foreground">Follow-up care plan</h3>
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
              ASCO SCP Section 2
            </span>
          </div>

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
                        <span
                          className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', STATUS_CHIP[c.kind])}
                        >
                          {c.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* -------------------------------------------------------- letter */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-card-foreground">PCP handoff letter</h3>
            <span className="flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                🖨️ Print SCP
              </button>
              <button
                type="button"
                onClick={() => toast('📨 SCP sent to the PCP clinic via secure fax + portal.')}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
              >
                Share with PCP
              </button>
              <button
                type="button"
                onClick={() => toast('👨👩👧 Care plan shared with family circle — caregiver mode updated.')}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
              >
                Share with family
              </button>
            </span>
          </div>

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
        </section>
      </div>
    </div>
  )
}
