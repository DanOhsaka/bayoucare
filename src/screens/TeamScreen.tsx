import { Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/motion/table'
import { ProgressTrack, riskTone } from '@/components/shared/ProgressTrack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ACTIONS,
  TEAM_PATIENTS,
  probabilityOf,
  riskOf,
  useTeam,
  type TeamPatient,
} from '@/store/team'
import { useVitals } from '@/store/vitals'
import { contributions, W, type Counterfactual, type RiskLevel } from '@/engine/team/risk'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/** Risk level → chip label, and the `Badge` variant that owns its colour pair. */
const RISK_LABEL: Record<RiskLevel, string> = {
  critical: 'Critical',
  watch: 'Watch',
  none: 'Stable',
}

const RISK_VARIANT: Record<RiskLevel, 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger',
  watch: 'warning',
  none: 'neutral',
}

/* The risk bands now live in `ProgressTrack` as `riskTone`, so the roster and
   the counterfactual board cannot drift apart. */

function RiskPill({ level }: { level: RiskLevel }) {
  return <Badge variant={RISK_VARIANT[level]}>{RISK_LABEL[level]}</Badge>
}

function RiskBar({ value }: { value: number }) {
  return <ProgressTrack pct={value} tone={riskTone(value)} valueText={`${value}%`} />
}

function CounterfactualLine({
  cf,
  current,
  applied,
  onApply,
  prominent = false,
}: {
  cf: Counterfactual
  current: number
  applied: boolean
  onApply: () => void
  prominent?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border border-brand-100 bg-accent px-3 py-2 text-sm',
        prominent && 'mt-2.5',
      )}
    >
      <Lightbulb className="size-4 shrink-0 text-primary" aria-hidden="true" strokeWidth={1.75} />
      <b className="text-accent-foreground">{cf.label}</b>
      <span className="text-link">
        {current}% → {cf.to}%
      </span>
      <span className="font-bold text-success-fg">−{cf.drop} pts</span>
      <Button
        type="button"
        size="xs"
        variant={applied ? 'outline' : 'default'}
        onClick={onApply}
        className="ml-auto font-bold"
      >
        {applied ? 'Applied ✓' : 'Apply'}
      </Button>
    </div>
  )
}

export function TeamScreen() {
  const t = useT()
  const applied = useTeam((s) => s.applied)
  const selectedId = useTeam((s) => s.selectedId)
  const toggle = useTeam((s) => s.toggle)
  const autoApply = useTeam((s) => s.autoApply)
  const select = useTeam((s) => s.select)

  const sweep = useVitals((s) => s.sweep)
  const alerts = useVitals((s) => s.alerts)

  const assessed = TEAM_PATIENTS.map((p) => ({ p, ...riskOf(applied[p.id] ?? new Set(), p) }))
  const flagged = assessed.filter((x) => x.level !== 'none')

  const critCount = assessed.filter((x) => x.level === 'critical').length
  const watchCount = assessed.filter((x) => x.level === 'watch').length

  // The intervention board, derived from every flagged patient's top three
  // counterfactuals.
  const board = Object.keys(ACTIONS).map((k) => {
    const hits = flagged.filter((x) => x.cfs.slice(0, 3).some((c) => c.key === k))
    const total = hits.reduce((s, x) => s + (x.cfs.find((c) => c.key === k)?.drop ?? 0), 0)
    return {
      k,
      label: ACTIONS[k].label,
      desc: ACTIONS[k].desc,
      n: hits.length,
      avg: total / Math.max(1, hits.length),
      ev: total / 100,
    }
  })
  const avoided = board.reduce((s, r) => s + r.ev, 0).toFixed(1)

  const selected = selectedId ? TEAM_PATIENTS.find((x) => x.id === selectedId) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('team.head')}</CardTitle>
          <Badge variant="success" className="text-left whitespace-normal">
            {t('team.chip')}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            One dashboard: patient-reported symptoms, auto-drafted visit summaries, and a 7-day risk
            forecast for every patient — <b className="text-card-foreground">each with the one action that changes the outcome.</b>
          </p>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------- impact row
          `gap-0 p-5` is the app's impact-tile idiom — see SlotBoardSection.

          Each tile reads number → label → explanation, in that order. It used
          to be number → one 60-to-95-character sentence, which meant all three
          tiles carried equal visual weight and the sentence competed with the
          figure it was describing. Scanning a dashboard should not require
          reading three paragraphs.

          Only the CRITICAL figure is coloured. That is the point of the row:
          one of these numbers needs action now and two are context. Colouring
          all three would colour none of them. `--danger` is 3.69:1 on the card,
          which clears the 3:1 large-text floor at this size; the amber would
          not (2.39:1), so the watch figure stays in the foreground colour
          rather than borrowing a contrast failure for decoration. */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          {
            n: critCount,
            label: 'Critical today',
            why: '7-day unplanned-care risk ≥ 50%',
            tone: 'text-danger',
          },
          {
            n: watchCount,
            label: 'On watch',
            why: 'Risk 25–50% — each has a counterfactual attached',
            tone: 'text-card-foreground',
          },
          {
            n: avoided,
            label: 'Avoidable / 30 days',
            why: 'Unplanned-care events, if the top actions are applied (demo model)',
            tone: 'text-card-foreground',
          },
        ].map((s, i) => (
          <Card key={i} className="gap-0 p-5">
            <div className={cn('text-2xl font-bold', s.tone)}>{s.n}</div>
            <div className="mt-1 text-xs font-semibold text-card-foreground">{s.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.why}</div>
          </Card>
        ))}
      </div>

      {/* ---------------------------------------------------------- alerts */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Needs attention — forecast with a prescription</CardTitle>
          <Badge variant="danger" className="text-left whitespace-normal">
            {critCount} critical · {watchCount} watch
            {alerts.length ? ` + ${alerts.length} ${t('vitals.alertLbl')}` : ''}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3">
            {/*
              Device-vitals, patient check-ins, and Remi crisis flags enter the
              SAME list. Writers push via useVitals.raiseAlert (or the 2am
              replay); this screen only reads — that is the closed loop.
            */}
            {alerts.map((v, i) => {
              const source = v.source ?? 'device'
              const sourceLabel =
                source === 'checkin'
                  ? 'Patient check-in'
                  : source === 'remi'
                    ? 'Remi chat · crisis flag'
                    : 'Objective vitals · temp patch'
              const level = v.level === 'watch' ? 'watch' : 'critical'
              return (
                <div
                  key={`${source}-${v.kind ?? i}-${i}`}
                  className={cn(
                    'rounded-lg border-2 p-4',
                    level === 'critical' ? 'border-danger bg-danger-bg' : 'border-warning bg-warning-bg',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <b className="text-sm font-semibold text-card-foreground">{v.name}</b>{' '}
                      <RiskPill level={level} />
                      <div className="mt-1 text-xs text-muted-foreground">
                        {sourceLabel} · {v.when} · {v.reading}
                      </div>
                    </div>
                    <Badge variant={level === 'critical' ? 'danger' : 'warning'}>
                      {source === 'device' ? 'auto-escalated' : 'on worklist'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-card-foreground">{v.msg}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {source === 'device'
                      ? ` Auto-escalation: on-call RN notified · caregiver SMS to Renee sent · ${v.followup}`
                      : `Next step: ${v.followup}`}
                  </p>
                </div>
              )
            })}

            {flagged.map((x) => {
              const top = x.cfs[0]
              const isApp = top ? (applied[x.p.id] ?? new Set()).has(top.key) : false
              return (
                <div
                  key={x.p.id}
                  className={cn(
                    'rounded-lg border-2 p-4',
                    x.level === 'critical' ? 'border-danger' : 'border-warning',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <b className="text-sm font-semibold text-card-foreground">{x.p.name}</b>{' '}
                      <RiskPill level={x.level} />
                      <div className="mt-1 text-xs text-muted-foreground">
                        {x.p.meta} · {x.p.driver}
                      </div>
                    </div>
                    <Badge variant="warning">7-day risk {x.cur}%</Badge>
                  </div>
                  <div className="mt-2.5">
                    <RiskBar value={x.cur} />
                  </div>
                  {top && (
                    <CounterfactualLine
                      cf={top}
                      current={x.cur}
                      applied={isApp}
                      prominent
                      onApply={() => toggle(x.p.id, top.key)}
                    />
                  )}
                </div>
              )
            })}

            {!alerts.length && !flagged.length && (
              <p className="text-sm text-muted-foreground">
                No flagged patients — everyone stable.
              </p>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Risks from the BayouCare logistic risk model (synthetic demo data). Counterfactuals show the
            projected risk after one action — hit Apply to log it to the worklist and watch the board
            re-run. Device vitals, patient check-ins, and Remi crisis flags enter this same list.
          </p>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- morning sweep */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t('vitals.sweepHead')}</CardTitle>
          <Badge variant="neutral">{t('vitals.sweepChip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('vitals.sweepHint')}</p>

          <div className="mt-3">
            <DataTable
              data={sweep}
              getRowId={(row, i) => String(row.name ?? i)}
              height={320}
              defaultSort={{ key: 'name', direction: 'asc' }}
              columns={[
                {
                  key: 'name',
                  header: 'Patient',
                  sortable: true,
                  title: (row) => String(row.name ?? ''),
                  cell: (row) => (
                    <span className="font-semibold text-card-foreground">
                      {String(row.name ?? '')}
                    </span>
                  ),
                },
                {
                  key: 'temp',
                  header: 'Temp now',
                  sortable: true,
                  cell: (row) => String(row.temp ?? ''),
                },
                {
                  key: 'tr',
                  header: '24h',
                  cell: (row) => (
                    <span className="text-muted-foreground">{String(row.tr ?? '')}</span>
                  ),
                },
                {
                  key: 'w',
                  header: 'Weight (30d)',
                  cell: (row) => (
                    <span className="text-muted-foreground">
                      {String(row.w ?? '')}
                      {Boolean(row.wd) && row.wd !== '—' && (
                        <span className="ml-1">({String(row.wd)})</span>
                      )}
                    </span>
                  ),
                },
                {
                  key: 'flag',
                  header: 'Device flags',
                  cell: (row) => (
                    <span
                      className={
                        row.flagCls === 'flag'
                          ? 'font-bold text-danger-fg'
                          : 'text-muted-foreground'
                      }
                    >
                      {String(row.flag ?? '')}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Synthetic device streams — run the <b className="text-card-foreground">2 am replay</b> in the
            patient app (Vitals → Simulate) to watch a fever land here before breakfast.
          </p>
        </CardContent>
      </Card>

      {/* ------------------------------------------ counterfactual board */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle> Counterfactual intervention board</CardTitle>
          <Badge variant="warning">What moves the needle · demo model</Badge>
        </CardHeader>

        <CardContent>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              /* A long label on a 320px screen: it wraps onto a second line
                 rather than pushing the page sideways.
                 `min-h-11` sits alongside `h-auto` because the two answer
                 different questions — `h-auto` lets the box grow past one line,
                 the minimum stops it collapsing to two lines' worth of 33px at
                 the widths where it does not wrap. They do not conflict:
                 min-height wins over an automatic height, and the label still
                 wraps freely past 44px. */
              className="h-auto min-h-11 py-2 text-left text-xs font-bold whitespace-normal lg:min-h-0"
              onClick={() => {
                autoApply()
                toast(' Top counterfactual applied for every flagged patient — worklist updated.')
              }}
            >
               Auto-apply top action for all flagged patients
            </Button>
            <span className="text-xs text-muted-foreground">
              One click runs the whole board — every flagged patient gets their best counterfactual
              applied to the worklist.
            </span>
          </div>

          <DataTable
            data={board}
            getRowId={(r) => r.k}
            height={420}
            rowHeight={64}
            defaultSort={{ key: 'ev', direction: 'desc' }}
            columns={[
              {
                key: 'label',
                header: 'Intervention',
                sortable: true,
                truncate: false,
                title: (r) => `${r.label} — ${r.desc}`,
                cell: (r) => (
                  <>
                    <b className="text-card-foreground">{r.label}</b>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </>
                ),
              },
              {
                key: 'n',
                header: 'Helps',
                sortable: true,
                truncate: false,
                sortValue: (r) => r.n,
                cell: (r) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Helps</span>
                    <b className="text-card-foreground">{r.n} patients</b>
                  </>
                ),
              },
              {
                key: 'avg',
                header: 'Avg risk drop',
                sortable: true,
                truncate: false,
                sortValue: (r) => r.avg,
                cell: (r) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Avg drop</span>
                    <b className="text-card-foreground">
                      {r.n ? `${r.avg.toFixed(1)} pts` : '—'}
                    </b>
                  </>
                ),
              },
              {
                key: 'ev',
                header: 'Projected impact',
                sortable: true,
                align: 'right',
                truncate: false,
                sortValue: (r) => r.ev,
                cell: (r) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Avoidable</span>
                    <b className="text-card-foreground">≈ {r.ev.toFixed(1)} events / 30d</b>
                  </>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------- roster */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Patient roster — 7-day risk model</CardTitle>
          <Badge variant="neutral" className="text-left whitespace-normal">
            updated daily · click a patient for counterfactual detail
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col">
            {assessed.map((x) => {
              const top = x.cfs[0]
              return (
                <Button
                  key={x.p.id}
                  type="button"
                  variant="ghost"
                  onClick={() => select(selectedId === x.p.id ? null : x.p.id)}
                  className={cn(
                    'grid h-auto grid-cols-2 items-center gap-3 rounded-none px-2 py-3 text-left font-normal whitespace-normal sm:grid-cols-[2fr_1fr_1.5fr_1.4fr_auto]',
                    selectedId === x.p.id && 'bg-accent',
                  )}
                >
                  <div>
                    <div className="text-sm font-semibold text-card-foreground">{x.p.name}</div>
                    <div className="text-xs text-muted-foreground">{x.p.meta}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {x.p.checkin}
                    <br />
                    <b className="text-card-foreground">{x.p.days}</b>
                  </div>
                  <RiskBar value={x.cur} />
                  <div className="text-xs text-muted-foreground">{top ? top.label : '—'}</div>
                  <RiskPill level={x.level} />
                </Button>
              )
            })}
          </div>

          {selected && <PatientDetail patient={selected} />}
        </CardContent>
      </Card>

      {/* ------------------------------------------- summary + time saved */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Auto-drafted visit summary</CardTitle>
            <Badge variant="warning">Generated by BayouCare</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
              <b className="text-card-foreground">
                Ms. Darlene Fontenot · MRN 44012 · Stage II IDC (ER+/PR+, HER2−) · Cycle 1
              </b>
              <br />
              <br />
              <b>Since last visit:</b> 5/6 check-ins completed. Fatigue 3/5 (stable), nausea 2/5
              (well-controlled with ondansetron), no fevers, pain 1/5.
              <br />
              <br />
              <b>Escalation:</b> none — within expected toxicity profile.
              <br />
              <br />
              <b>Patient questions:</b> (1) How will we know chemo is working? (2) Should she pursue
              BRCA testing — two adult daughters?
              <br />
              <br />
              <b>Logistics:</b> transport confirmed for Aug 14 infusion; mileage reimbursement
              application started.
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Clinician edits in 1 click — draft summary for the visit note (not synced to an EHR in this build).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle> Admin time saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['2.1', 'hrs saved / week / clinician'],
                ['41', 'auto-summaries drafted'],
                ['9', 'calls avoided with triage flags'],
              ].map(([n, d]) => (
                <div key={d} className="rounded-lg border border-border bg-accent p-4">
                  <div className="text-2xl font-bold text-link">{n}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo illustration of admin-time savings — synthetic figures for the worklist story, not a
              measured pilot result.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** The counterfactual detail panel, opened by clicking a roster row. */
function PatientDetail({ patient }: { patient: TeamPatient }) {
  const applied = useTeam((s) => s.applied)
  const toggle = useTeam((s) => s.toggle)

  const set = applied[patient.id] ?? new Set<string>()
  const s = riskOf(set, patient)
  const base = Math.round(probabilityOf(new Set(), patient) * 100)
  const contribs = contributions(patient.f)
  const max = Math.max(...contribs.map((c) => Math.abs(c.v)), 0.001)
  const nApplied = set.size

  return (
    <div className="mt-4 rounded-lg border border-border bg-accent p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-accent-foreground">
          {patient.name} — counterfactual detail
        </h3>
        <Badge variant="neutral" className="text-left whitespace-normal">
          baseline {base}% · now {s.cur}% · {nApplied ? `${nApplied} action(s) applied` : 'no actions applied'}
        </Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <b className="text-sm text-accent-foreground">What's driving the risk</b>
          <p className="mt-1 text-xs text-muted-foreground">{patient.driver}</p>
          <div className="mt-2 flex flex-col gap-2">
            {contribs.map((c) => (
              <ProgressTrack
                key={c.k}
                label={c.label}
                pct={(Math.abs(c.v) / max) * 100}
                // Red pushes risk UP and blue-ish pulls it down — the direction
                // is the meaning here, not a severity band.
                tone={c.v >= 0 ? 'danger' : 'brand'}
                width="w-12"
                valueText={`${c.v >= 0 ? '+' : ''}${c.v.toFixed(2)}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Logistic risk model (demo): logit = {W.B0} + {W.anc}·ANC + {W.days}·missed + {W.adm}·admission
            + {W.miles}·miles + {W.sdoh}·SDOH + {W.cycle}·cycle. Each bar is weight × value — red pushes
            risk up.
          </p>
        </div>

        <div>
          <b className="text-sm text-accent-foreground">
            Counterfactual actions — apply one and the model re-runs
          </b>
          <div className="mt-2 flex flex-col gap-1.5">
            {s.cfs.map((c) => (
              <CounterfactualLine
                key={c.key}
                cf={c}
                current={s.cur}
                applied={set.has(c.key)}
                onApply={() => toggle(patient.id, c.key)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Each apply mutates the feature vector and the logistic model recomputes live — the same
            math the worklist uses.
          </p>
        </div>
      </div>
    </div>
  )
}
