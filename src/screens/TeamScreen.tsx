import { toast } from 'sonner'

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

const PILL: Record<RiskLevel, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'bg-danger-bg text-danger-fg' },
  watch: { label: 'Watch', cls: 'bg-warning-bg text-warning-fg' },
  none: { label: 'Stable', cls: 'bg-muted text-muted-foreground' },
}

/** Risk colour thresholds, shared by every bar. */
const riskBarClass = (v: number) => (v >= 50 ? 'bg-danger' : v >= 25 ? 'bg-warning' : 'bg-brand-500')

function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', PILL[level].cls)}>
      {PILL[level].label}
    </span>
  )
}

function RiskBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-muted">
        <i
          className={cn('block h-full rounded-full', riskBarClass(value))}
          style={{ width: `${Math.min(100, value)}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="w-9 flex-none text-right text-xs font-bold text-card-foreground">{value}%</span>
    </div>
  )
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
      <span aria-hidden="true">💡</span>
      <b className="text-accent-foreground">{cf.label}</b>
      <span className="text-brand-700">
        {current}% → {cf.to}%
      </span>
      <span className="font-bold text-success-fg">−{cf.drop} pts</span>
      <button
        type="button"
        onClick={onApply}
        className={cn(
          'ml-auto rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
          applied
            ? 'border border-border text-foreground hover:bg-background'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {applied ? 'Applied ✓' : 'Apply'}
      </button>
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
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">{t('team.head')}</h3>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {t('team.chip')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          One dashboard: patient-reported symptoms, auto-drafted visit summaries, and a 7-day risk
          forecast for every patient — <b className="text-card-foreground">each with the one action that changes the outcome.</b>
        </p>
      </section>

      {/* ------------------------------------------------------- impact row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          [critCount, 'critical forecast today — 7-day unplanned-care risk ≥ 50%'],
          [watchCount, 'watch forecasts — risk 25–50%, a counterfactual action attached to each'],
          [avoided, 'unplanned-care events projected avoidable / 30 days if top actions are applied (demo model)'],
        ].map(([n, d], i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow)]">
            <div className="text-2xl font-bold text-brand-700">{n}</div>
            <div className="mt-1 text-xs text-muted-foreground">{d}</div>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------------- alerts */}
      <section className="mt-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">
            Needs attention — forecast with a prescription
          </h3>
          <span className="rounded-full bg-danger-bg px-2.5 py-1 text-xs font-bold text-danger-fg">
            {critCount} critical · {watchCount} watch
            {alerts.length ? ` + ${alerts.length} ${t('vitals.alertLbl')}` : ''}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/*
            Device-vitals alerts enter the SAME list as the forecasts, and they
            arrive with no explicit sync: the 2am replay writes them to the vitals
            store and this screen reads it. That is the cross-module moment.
          */}
          {alerts.map((v, i) => (
            <div key={i} className="rounded-lg border-2 border-danger bg-danger-bg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <b className="text-sm font-semibold text-card-foreground">{v.name}</b>{' '}
                  <RiskPill level="critical" />
                  <div className="mt-1 text-xs text-muted-foreground">
                    Objective vitals · temp patch · {v.when} · {v.reading}
                  </div>
                </div>
                <span className="rounded-full bg-danger-bg px-2.5 py-1 text-xs font-bold text-danger-fg">
                  ⚡ auto-escalated
                </span>
              </div>
              <p className="mt-2 text-sm text-card-foreground">{v.msg}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ⚡ Auto-escalation: on-call RN notified · caregiver SMS to Renee sent · {v.followup}
              </p>
            </div>
          ))}

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
                  <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
                    7-day risk {x.cur}%
                  </span>
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
          re-run. Device-vitals alerts (Rank 6) enter the same list, auto-escalated.
        </p>
      </section>

      {/* -------------------------------------------------- morning sweep */}
      <section className="mt-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">{t('vitals.sweepHead')}</h3>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            {t('vitals.sweepChip')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('vitals.sweepHint')}</p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Patient', 'Temp now', '24h', 'Weight (30d)', 'Device flags'].map((h) => (
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
              {sweep.map((row, i) => (
                <tr key={i}>
                  <td className="border-b border-border px-3 py-2.5 font-semibold text-card-foreground">
                    {String(row.name ?? '')}
                  </td>
                  <td className="border-b border-border px-3 py-2.5 text-card-foreground">
                    {String(row.temp ?? '')}
                  </td>
                  <td className="border-b border-border px-3 py-2.5 text-muted-foreground">
                    {String(row.tr ?? '')}
                  </td>
                  <td className="border-b border-border px-3 py-2.5 text-muted-foreground">
                    {String(row.w ?? '')}
                    {/* `&&` on an `unknown` field yields `unknown`, which is not a
                        valid ReactNode — hence the explicit Boolean(). */}
                    {Boolean(row.wd) && row.wd !== '—' && (
                      <span className="ml-1 text-muted-foreground">({String(row.wd)})</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      'border-b border-border px-3 py-2.5',
                      row.flagCls === 'flag' ? 'font-bold text-danger-fg' : 'text-muted-foreground',
                    )}
                  >
                    {String(row.flag ?? '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Synthetic device streams — run the <b className="text-card-foreground">2 am replay</b> in the
          patient app (Vitals → Simulate) to watch a fever land here before breakfast.
        </p>
      </section>

      {/* ------------------------------------------ counterfactual board */}
      <section className="mt-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">
            ⚡ Counterfactual intervention board
          </h3>
          <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
            What moves the needle · demo model
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              autoApply()
              toast('⚡ Top counterfactual applied for every flagged patient — worklist updated.')
            }}
            className="h-9 rounded-md bg-primary px-3.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            ⚡ Auto-apply top action for all flagged patients
          </button>
          <span className="text-xs text-muted-foreground">
            One click runs the whole board — every flagged patient gets their best counterfactual
            applied to the worklist.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Intervention', 'Helps', 'Avg risk drop', 'Projected impact'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'border-b border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground',
                      i === 3 ? 'text-right' : 'text-left',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.map((r) => (
                <tr key={r.k}>
                  <td className="border-b border-border px-3 py-3">
                    <b className="text-card-foreground">{r.label}</b>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </td>
                  <td className="border-b border-border px-3 py-3 text-muted-foreground">
                    <span className="block text-xs">Helps</span>
                    <b className="text-card-foreground">{r.n} patients</b>
                  </td>
                  <td className="border-b border-border px-3 py-3 text-muted-foreground">
                    <span className="block text-xs">Avg drop</span>
                    <b className="text-card-foreground">{r.n ? `${r.avg.toFixed(1)} pts` : '—'}</b>
                  </td>
                  <td className="border-b border-border px-3 py-3 text-right">
                    <span className="block text-xs text-muted-foreground">Avoidable</span>
                    <b className="text-card-foreground">≈ {r.ev.toFixed(1)} events / 30d</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------- roster */}
      <section className="mt-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">
            Patient roster — 7-day risk model
          </h3>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            updated daily · click a patient for counterfactual detail
          </span>
        </div>

        <div className="flex flex-col">
          {assessed.map((x) => {
            const top = x.cfs[0]
            return (
              <button
                key={x.p.id}
                type="button"
                onClick={() => select(selectedId === x.p.id ? null : x.p.id)}
                className={cn(
                  'grid grid-cols-2 items-center gap-3 border-b border-border px-2 py-3 text-left transition-colors hover:bg-accent sm:grid-cols-[2fr_1fr_1.5fr_1.4fr_auto]',
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
              </button>
            )
          })}
        </div>

        {selected && <PatientDetail patient={selected} />}
      </section>

      {/* ------------------------------------------- summary + time saved */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-card-foreground">
              🤖 Auto-drafted visit summary
            </h3>
            <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
              Generated by BayouCare
            </span>
          </div>
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
            Clinician edits in 1 click — summary syncs to the EHR as a structured note.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <h3 className="mb-3 text-base font-semibold text-card-foreground">⚡ Admin time saved</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['2.1', 'hrs saved / week / clinician'],
              ['41', 'auto-summaries drafted'],
              ['9', 'calls avoided with triage flags'],
            ].map(([n, d]) => (
              <div key={d} className="rounded-lg border border-border bg-accent p-4">
                <div className="text-2xl font-bold text-brand-700">{n}</div>
                <div className="mt-1 text-xs text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Pilot metrics — first 4 weeks, 8 patients. Scales to the full Ochsner oncology service
            line.
          </p>
        </section>
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
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
          baseline {base}% · now {s.cur}% · {nApplied ? `${nApplied} action(s) applied` : 'no actions applied'}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <b className="text-sm text-accent-foreground">What's driving the risk</b>
          <p className="mt-1 text-xs text-muted-foreground">{patient.driver}</p>
          <div className="mt-2 flex flex-col gap-2">
            {contribs.map((c) => (
              <div key={c.k} className="flex items-center gap-2">
                <span className="w-32 flex-none text-xs text-muted-foreground">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', c.v >= 0 ? 'bg-danger' : 'bg-brand-500')}
                    style={{ width: `${Math.min(100, (Math.abs(c.v) / max) * 100)}%` }}
                  />
                </div>
                <span className="w-12 flex-none text-right text-xs font-bold text-card-foreground">
                  {c.v >= 0 ? '+' : ''}
                  {c.v.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
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
          <p className="mt-3 text-[11px] text-muted-foreground">
            Each apply mutates the feature vector and the logistic model recomputes live — the same
            math the worklist uses.
          </p>
        </div>
      </div>
    </div>
  )
}
