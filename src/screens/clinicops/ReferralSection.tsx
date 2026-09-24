import { Check } from 'lucide-react'
import { toast } from 'sonner'

import { ProgressTrack } from '@/components/shared/ProgressTrack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/reui/stepper'
import {
  ALL_REFERRALS,
  refBundle,
  refDestCity,
  refNextStep,
  refOf,
  refPatient,
  refProgress,
  refTimeline,
  refTriage,
} from '@/engine/clinic/referrals'
import type { RiskLevel } from '@/engine/team/risk'
import { cn } from '@/lib/utils'
import { useClinic } from '@/store/clinic'
import { useTeam } from '@/store/team'

/**
 * Rank 11 — Referral Express.
 *
 * Three cards: the intro, the incoming-referral list beside the timeline, and
 * the FHIR R4 transaction bundle. Selection and progress live in the clinic
 * store (`refId`, `refStep`) rather than local state, so the list, the rail and
 * the bundle stay on one referral.
 *
 * `applied` comes straight off the Care Team worklist and goes into `refTriage`.
 * That is the coupling: the triage chip on a referral row is the same Rank 1
 * logistic risk the roster shows, computed by the same helpers, so applying a
 * counterfactual action on Care Team moves this number too.
 */

/** The legacy's level→chip mapping (`coral`/`amber`/`green`) in this app's
 *  paired status tokens. */
const TRIAGE_BADGE: Record<RiskLevel, 'danger' | 'warning' | 'success'> = {
  critical: 'danger',
  watch: 'warning',
  none: 'success',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]![0] : ''
  return (a + b).toUpperCase() || '?'
}

export function ReferralSection() {
  const refId = useClinic((s) => s.refId)
  const setRefId = useClinic((s) => s.setRefId)
  const refStep = useClinic((s) => s.refStep)
  const advanceRef = useClinic((s) => s.advanceRef)

  const applied = useTeam((s) => s.applied)

  const selected = refOf(refId)
  const extra = refStep[refId] ?? 0

  const progress = selected ? refProgress(selected, extra) : null
  const triage = selected ? refTriage(selected, applied) : null
  const steps = selected ? refTimeline(selected, extra) : []

  /**
   * Walk the selected referral one step along its timeline.
   *
   * The legacy mutated the step's done flag in place and returned early with a
   * toast once there was nothing left to complete; here the store carries the
   * count and `refTimeline` derives the rail from it.
   */
  function advance() {
    const r = refOf(refId)
    if (!r) return
    const next = refNextStep(r, extra)
    if (!next) {
      toast('This referral is complete end-to-end — records are back with the PCP.')
      return
    }
    advanceRef(refId)
    toast(`${next} — logged to the referral timeline.`)
  }

  const timelineActive =
    steps.length === 0
      ? 1
      : steps.every((s) => s.done)
        ? steps.length + 1
        : steps.findIndex((s) => !s.done) + 1

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referral Express</CardTitle>
          <Badge variant="neutral" className="text-left whitespace-normal">
            mock SMART-on-FHIR R4 surface · synthetic bundle · no PHI
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A rural PCP sends one referral; labs, pathology and consent ride along; both ends can see
            the status. Triage urgency is{' '}
            <b className="text-card-foreground">the same logistic risk score</b> the care-team
            dashboard uses — not a separate model.
          </p>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Incoming referrals</CardTitle>
            <CardAction>
              <Button type="button" size="xs" onClick={advance} className="font-bold">
                Advance one step
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {ALL_REFERRALS.map((r) => {
              const p = refProgress(r, refStep[r.id] ?? 0)
              const tr = refTriage(r, applied)
              const sel = r.id === refId
              const name = refPatient(r)?.name ?? r.pid
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => setRefId(r.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                    sel
                      ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/40 hover:border-brand-500 hover:bg-brand-500/15'
                      : 'border-border bg-muted/30 hover:bg-muted/50',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex size-9 flex-none items-center justify-center rounded-full text-xs font-bold tracking-wide',
                      sel
                        ? 'bg-brand-600 text-on-dark'
                        : 'bg-brand-700/90 text-on-dark dark:bg-brand-800',
                    )}
                  >
                    {initials(name)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold leading-5 text-card-foreground">
                        {name}
                      </span>
                      <Badge
                        variant={TRIAGE_BADGE[tr.level]}
                        className="max-w-[9.5rem] shrink-0 truncate"
                      >
                        {tr.score}% risk
                      </Badge>
                    </div>
                    <p className="truncate text-xs leading-4 text-muted-foreground">
                      {r.fromCity} → {refDestCity(r)} · {p.done}/{p.total} steps · {r.coverage}
                    </p>
                    <ProgressTrack
                      className="mt-1.5"
                      pct={p.pct}
                      tone={p.pct === 100 ? 'brand' : 'warning'}
                    />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Referral timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {selected && progress && triage ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <b className="text-card-foreground">{selected.to}</b>
                    <Badge variant="neutral">{selected.coverage}</Badge>
                  </div>
                  <Badge
                    variant={TRIAGE_BADGE[triage.level]}
                    className="w-fit max-w-full whitespace-normal"
                  >
                    triage {triage.score}% — Rank 1 model
                  </Badge>
                </div>

                <Stepper
                  key={`${refId}-${extra}`}
                  value={timelineActive}
                  orientation="vertical"
                  className="w-full"
                  indicators={{
                    completed: <Check className="size-3.5" aria-hidden="true" strokeWidth={2.5} />,
                  }}
                >
                  <StepperNav className="w-full">
                    {steps.map((s, index) => {
                      const n = index + 1
                      return (
                        <StepperItem
                          key={`${s.label}-${n}`}
                          step={n}
                          completed={s.done}
                          className="relative items-start not-last:flex-1"
                        >
                          <StepperTrigger className="w-full cursor-default items-start gap-2.5 rounded-md pb-8 last:pb-0">
                            <StepperIndicator className="data-[state=completed]:bg-success data-[state=completed]:text-white data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                              {n}
                            </StepperIndicator>
                            <div className="mt-0.5 min-w-0 flex-1 space-y-1 text-left">
                              <StepperTitle className="group-data-[state=inactive]/step:text-muted-foreground text-start font-semibold group-data-[state=active]/step:text-primary group-data-[state=completed]/step:text-primary">
                                {s.label}
                              </StepperTitle>
                              <StepperDescription className="text-xs leading-relaxed">
                                {s.when}
                              </StepperDescription>
                            </div>
                          </StepperTrigger>
                          {n < steps.length ? (
                            <StepperSeparator className="group-data-[state=completed]/step:bg-success absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-2rem)]" />
                          ) : null}
                        </StepperItem>
                      )
                    })}
                  </StepperNav>
                </Stepper>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/25 p-3 text-xs">
                  <div>
                    <span className="block text-muted-foreground">Distance</span>
                    <span className="mt-0.5 block text-sm font-bold text-card-foreground">
                      {selected.miles} mi
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Transport</span>
                    <span className="mt-0.5 block text-sm font-bold text-card-foreground">
                      {selected.transport}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Broadband</span>
                    <span className="mt-0.5 block text-sm font-bold text-card-foreground">
                      {selected.broadband}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Complete</span>
                    <span className="mt-0.5 block text-sm font-bold text-card-foreground">
                      {progress.pct}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a referral to see its timeline.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FHIR R4 bundle — posted to the receiving org</CardTitle>
          <Badge variant="neutral" className="text-left whitespace-normal">
            resourceType / entry[] · truncated
          </Badge>
        </CardHeader>
        <CardContent>
          {selected ? (
            <pre className="max-h-[230px] overflow-auto whitespace-pre rounded-md bg-brand-900 p-3 font-mono text-xs text-on-dark-muted">
              {refBundle(selected)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a referral to see the bundle that was posted.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
