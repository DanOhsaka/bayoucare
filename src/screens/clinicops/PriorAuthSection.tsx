import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

import { RichText } from '@/components/shared/RichText'
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
  AUTH_IDS,
  authCase,
  authChecklist,
  authRail,
  buildAuthLetter,
  type AuthModel,
} from '@/engine/clinic/auth'
import { useInterval } from '@/hooks/useInterval'
import { cn } from '@/lib/utils'
import { useClinic } from '@/store/clinic'
import { useTeam } from '@/store/team'

/**
 * Rank 9 — prior-auth autopilot.
 *
 * Three cards: the picker, the coverage-and-necessity packet, and the payer
 * letter. Selection and submitted state live in the clinic store (`authId`,
 * `authSubmitted`) rather than local state, so the picker, the tracker and the
 * letter stay on one case.
 *
 * The one thing NOT in the store is the submit animation — its log lines and
 * the tracker step it has walked to are transient to this panel. They are keyed
 * by patient id so a submission in flight keeps landing on the case it was
 * started for, even if you switch patients while the payer is "thinking" (the
 * legacy pushed its rail steps onto whatever case happened to be selected).
 *
 * `applied` comes straight off the Care Team worklist. That is the coupling:
 * the transport criterion below is unmet until a transport or SDOH
 * counterfactual is applied on the Care Team tab, and the criteria-met count
 * and the letter both move the moment one is.
 */

/** Every case that resolves, in `AUTH_CASES` order — the picker's source. */
const CASES = AUTH_IDS.map((id) => ({ id, a: authCase(id) })).filter(
  (x): x is { id: string; a: AuthModel } => x.a !== null,
)

/** The payer's turnaround, as the legacy replayed it. `id` is captured so the
 *  beats describe the case that was actually submitted. */
function beatsFor(id: string): Array<[string, string]> {
  const a = authCase(id)
  if (!a) return []
  const { c } = a
  return [
    ['09:14', `Packet transmitted to ${c.payer} — ${authRail(id).ref}`],
    [
      '09:14',
      `Electronic attachment: ${c.docs.length} documents, ${c.jcodes.length} J-codes`,
    ],
    ['11:02', 'Payer acknowledged — medical-necessity review opened'],
    ['11:48', 'Approved. Authorization issued, valid 90 days from the planned cycle.'],
  ]
}

export function PriorAuthSection() {
  const authId = useClinic((s) => s.authId)
  const setAuthId = useClinic((s) => s.setAuthId)
  const authSubmitted = useClinic((s) => s.authSubmitted)
  const submitAuth = useClinic((s) => s.submitAuth)

  const applied = useTeam((s) => s.applied)

  /** The submission in flight, if any — one at a time, as the legacy's timer was. */
  const [run, setRun] = useState<{ id: string; i: number; beats: Array<[string, string]> } | null>(
    null,
  )
  const [logs, setLogs] = useState<Record<string, string[]>>({})
  const [railStep, setRailStep] = useState<Record<string, number>>({})

  const logRef = useRef<HTMLDivElement>(null)

  useInterval(
    () => {
      if (!run) return
      const { id, i, beats } = run
      if (i >= beats.length) {
        setRun(null)
        toast(
          ` Authorization approved — ${authRail(id).ref}. Median turnaround here is 1–3 days; this took 2h 34m.`,
        )
        return
      }
      const [t, text] = beats[i]
      setLogs((l) => ({ ...l, [id]: [...(l[id] ?? []), `${t}  ${text}`] }))
      // The legacy pushed a tracker step on every beat after the first, which
      // is what walks the rail from "under review" to "infusion scheduled".
      if (i >= 1) setRailStep((r) => ({ ...r, [id]: Math.min(3, (r[id] ?? 0) + 1) }))
      setRun({ id, i: i + 1, beats })
    },
    run ? 900 : null,
  )

  // The legacy kept the log pinned to its last line as beats arrived.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, authId])

  const model = CASES.find((x) => x.id === authId) ?? null
  const submitted = authSubmitted.has(authId)
  const list = authChecklist(authId, applied)
  const checklistItems = list.filter((x) => x.ok).length

  const rail = authRail(authId, submitted, railStep[authId] ?? 0)
  const lines = logs[authId] ?? []

  function submit() {
    if (run || !model) return
    submitAuth(authId)
    setLogs((l) => ({ ...l, [authId]: [] }))
    setRailStep((r) => ({ ...r, [authId]: 0 }))
    setRun({ id: authId, i: 0, beats: beatsFor(authId) })
  }

  if (!model) return null

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prior-Auth Autopilot</CardTitle>
          <Badge variant="warning">Rank 9 · brief area 5</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
           Payer packets assembled from the chart in seconds, with the guideline citation and every
            medical-necessity criterion checked. Pick a patient:
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {CASES.map(({ id, a }) => (
              <Button
                key={id}
                type="button"
                size="xs"
                variant={authId === id ? 'default' : 'outline'}
                aria-pressed={authId === id}
                onClick={() =>setAuthId(id)}
                className="rounded-full px-2.5 font-bold"
              >
                {a.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coverage &amp; necessity</CardTitle>
            <Badge variant="neutral">{rail.ref}</Badge>
          </CardHeader>
          <CardContent>
            {/* ------------------------------------------------ tracker */}
            {(() => {
              const doneCount = rail.steps.filter((s) => s.done).length
              const activeValue =
                doneCount >= rail.steps.length ? rail.steps.length + 1 : doneCount + 1
              return (
                <Stepper
                  key={`${authId}-${submitted}-${railStep[authId] ?? 0}`}
                  value={activeValue}
                  orientation="vertical"
                  className="w-full"
                  indicators={{
                    completed: <Check className="size-3.5" aria-hidden="true" strokeWidth={2.5} />,
                  }}
                >
                  <StepperNav className="w-full">
                    {rail.steps.map((s, index) => {
                      const n = index + 1
                      return (
                        <StepperItem
                          key={s.label}
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
                          {n < rail.steps.length ? (
                            <StepperSeparator className="group-data-[state=completed]/step:bg-success absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-2rem)]" />
                          ) : null}
                        </StepperItem>
                      )
                    })}
                  </StepperNav>
                </Stepper>
              )
            })()}

            {/* --------------------------------------- criteria summary */}
            <div className="mt-3 grid grid-cols-2 gap-x-3.5 gap-y-2 text-xs">
              <div>
                <span className="block text-muted-foreground">Criteria met</span>
                <span
                  className={cn(
                    'block font-bold',
                    checklistItems === list.length ? 'text-success-fg' : 'text-warning-fg',
                  )}
                >
                  {checklistItems}/{list.length}
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground">Payer</span>
                <span className="block font-bold text-card-foreground">{model.a.c.plan}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Guideline</span>
                <span className="block font-bold text-card-foreground">{model.a.c.guide.body}</span>
              </div>
            </div>

            {/* -------------------------------------- necessity criteria */}
            <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3">
              {list.map((x, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-start gap-2">
                    <Badge variant={x.ok ? 'success' : 'warning'}>{x.ok ? 'met' : 'pending'}</Badge>
                    <span className="min-w-0 flex-1 text-card-foreground">{x.t}</span>
                  </div>
                  {x.note && <p className="mt-0.5 text-muted-foreground">{x.note}</p>}
                </div>
              ))}
            </div>

            {/* ------------------------------------------------- pay log */}
            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              className="mt-3 max-h-[200px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs text-on-dark-muted"
            >
              {lines.length === 0 ? (
                <span>Submission log — the payer&apos;s turnaround lands here beat by beat.</span>
              ) : (
                lines.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authorization request</CardTitle>
            <CardAction>
              <Button
                type="button"
                size="xs"
                onClick={submit}
                disabled={run !== null}
                aria-busy={run !== null}
                className="font-bold"
              >
                Submit to payer
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {/* Authored prose with inline emphasis, built here from the app's own
                data — the same rendering path as the survivorship letter. */}
            <RichText
              html={buildAuthLetter(authId, applied)}
              className="block whitespace-pre-line rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-card-foreground"
            />
            <p className="mt-2 text-xs text-muted-foreground">
             Synthetic chart, synthetic payer — nothing is transmitted anywhere. The transport
              criterion reads the Counterfactual actions applied on the Care Team tab, so a Rank 1
              action visibly strengthens this packet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
