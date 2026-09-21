import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cdsAlerts, type CdsAlert, type CdsStatus } from '@/engine/clinic/cds'
import { cn } from '@/lib/utils'
import { useClinic, type CdsFilter } from '@/store/clinic'
import { useUi } from '@/store/ui'

/**
 * Rank 12 — PCP clinical decision-support feed.
 *
 * The alert inbox a rural PCP opens in the morning. Filter selection lives in
 * the clinic store (`cdsFilter`) rather than local state, matching the sibling
 * Clinic Ops panels; what the clinician has *done* with an alert is session
 * state and stays here.
 *
 * Nothing clinical is authored in this file — `cdsAlerts()` runs the same
 * `riskLung` / `riskBreast` / `riskColo` engines the patient-facing calculator
 * runs, which is what "Probe in patient app" demonstrates.
 */

const FILTERS: Array<{ value: CdsFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'ldct', label: 'Lung · LDCT' },
  { value: 'breast', label: 'Breast' },
  { value: 'colo', label: 'Colorectal' },
]

export function CdsSection() {
  const cdsFilter = useClinic((s) => s.cdsFilter)
  const setCdsFilter = useClinic((s) => s.setCdsFilter)
  const probe = useClinic((s) => s.probe)
  const setMode = useUi((s) => s.setMode)
  const navigate = useNavigate()

  /*
   * Built once, like the legacy's module-scope `let cdsState = cdsAlerts()`:
   * the inbox is a snapshot of static demo data and does not change underfoot.
   * The mutable half — accept / dismiss / send — is keyed by alert id below, so
   * the engine stays a pure function of the panel.
   */
  const alerts = useMemo(() => cdsAlerts(), [])
  const [status, setStatus] = useState<Record<string, CdsStatus>>({})

  const live = alerts.filter((a) => cdsFilter === 'all' || a.kind === cdsFilter)
  // Counted over every alert, not the filtered view — the legacy's `#cdsCount`
  // read the same way.
  const open = alerts.filter((a) => status[a.key] !== 'dismissed').length
  const filterLabel = FILTERS.find((f) => f.value === cdsFilter)?.label ?? 'All'

  function act(a: CdsAlert, next: CdsStatus) {
    setStatus((s) => ({ ...s, [a.key]: next }))
  }

  /**
   * "Probe in patient app" — the coupling this workflow exists to show.
   *
   * The legacy reached into the patient app's DOM by element id and assigned
   * the calculator inputs, then jumped tabs:
   * `set('lungAge', a.inputs.age); …; calcLung(); gotoView('app');
   * showScreen('prevent')`. Here it is a store write plus a route change:
   * `probe()` seeds the shared `calc` slice the calculator reads, the mode
   * flips back to Patient, and the router lands on Screen & Prevent — where the
   * numbers come from the same three engine calls that built this card.
   */
  function probeInApp(a: CdsAlert) {
    probe(a.kind, a.inputs)
    setMode('patient')
    navigate('/my-care/prevent')
    toast(
      '🔍 Same engine, same numbers — switched you into Patient mode; this is the calculator your patient sees.',
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🩺 PCP clinical decision support feed</CardTitle>
          <CardAction>
            <Badge variant="warning">Rank 12 · brief areas 4, 5</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Alert cards as they land in a rural PCP's inbox. Each is computed by the{' '}
            <b className="text-card-foreground">same engine as the patient-facing calculator</b> —
            hit <b className="text-card-foreground">Probe in patient app</b> to see the identical
            numbers on the patient side.
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={cdsFilter === f.value}
                onClick={() => setCdsFilter(f.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  cdsFilter === f.value
                    ? 'border-brand-600 bg-brand-700 text-on-dark'
                    : 'border-border bg-background text-foreground hover:bg-accent',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/*
            The legacy wrote this line into `#cdsCount` by hand, and because
            both counts are taken over the whole inbox its visible text never
            moved when the filter changed — so the region would announce
            nothing. The filtered count rides along in the visually-hidden span
            to give the live region something to say.
          */}
          <p aria-live="polite" className="mt-2.5 text-xs text-muted-foreground">
            {open} open · {alerts.length} total
            <span className="sr-only">
              {` — showing ${live.length} of ${alerts.length} (${filterLabel})`}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* The legacy `#cdsInbox` — the flag cards, outside the intro card. */}
      <div className="flex flex-col gap-2.5">
        {live.length ? (
          live.map((a) => (
            <AlertCard
              key={a.key}
              a={a}
              status={status[a.key] ?? 'new'}
              onAct={(next) => act(a, next)}
              onProbe={() => probeInApp(a)}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No alerts in this filter.</p>
        )}
      </div>
    </div>
  )
}

/**
 * One flag card.
 *
 * Deliberately not the `Card` primitive: this is the legacy `.flagcard`, a
 * different shape from the panel idiom `Card` encodes — a 5px tier-coloured
 * left rail, tighter padding, and no elevation, since the card is not itself
 * clickable. The app's other alert lists (the care-team forecast cards) are
 * hand-built for the same reason.
 */
function AlertCard({
  a,
  status,
  onAct,
  onProbe,
}: {
  a: CdsAlert
  status: CdsStatus
  onAct: (next: CdsStatus) => void
  onProbe: () => void
}) {
  const high = a.tier === 'high'

  return (
    <div
      className={cn(
        'rounded-xl border border-border border-l-[5px] bg-card px-[18px] py-[15px]',
        high ? 'border-l-danger' : 'border-l-warning',
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-sm font-semibold text-card-foreground">{a.pt.name}</b>
          <span className="rounded-md border border-border bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground">
            Flag/{a.key}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={high ? 'danger' : 'warning'}>{high ? 'HIGH' : 'MODERATE'}</Badge>
          {status === 'accepted' && <Badge variant="success">accepted ✓</Badge>}
          {status === 'dismissed' && <Badge variant="neutral">dismissed</Badge>}
        </div>
      </div>

      {/* `{a.score}{a.unit}` on one line on purpose — split across lines, JSX
          would drop the whitespace-only chunk between them, which is right, but
          keeping them adjacent states that "100% 6-yr" / "52/100" is a single
          unbroken string rather than two fields. */}
      <p className="text-sm text-card-foreground">
        <b>{a.label}</b> — {a.score}{a.unit} · {a.why}
      </p>
      <p className="text-xs text-muted-foreground">
        {a.action} · <span className="opacity-80">{a.source}</span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            onAct('accepted')
            toast(`✅ Order placed — ${a.action} · logged to the worklist.`)
          }}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Accept &amp; order
        </button>
        <button
          type="button"
          onClick={onProbe}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
        >
          🔍 Probe in patient app
        </button>
        <button
          type="button"
          onClick={() => {
            // The legacy accepted the alert as part of sending it, then only
            // toasted — "send" does not follow the patient into their app.
            onAct('accepted')
            toast(`📲 Sent to ${a.pt.name}’s patient app → Screen & Prevent.`)
          }}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
        >
          Send to patient
        </button>
        <button
          type="button"
          onClick={() => {
            onAct('dismissed')
            toast('🚫 Alert dismissed — reason logged for the quality report.')
          }}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-accent"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
