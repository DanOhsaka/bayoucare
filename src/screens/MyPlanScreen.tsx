import { useMemo } from 'react'
import { toast } from 'sonner'

import { PATIENTS } from '@/data'
import { scpModel, statusChip, type PlanRow } from '@/engine/survivorship/planRows'
import { usePatient } from '@/store/patient'
import { cn } from '@/lib/utils'

const CHIP: Record<string, string> = {
  danger: 'bg-danger-bg text-danger-fg',
  warning: 'bg-warning-bg text-warning-fg',
  success: 'bg-success-bg text-success-fg',
  neutral: 'bg-muted text-muted-foreground',
}

/** The surveillance schedule. Wrapped so it scrolls on a phone instead of
 *  squeezing five columns — the legacy had no overflow wrapper here. */
function PlanTable({ rows }: { rows: PlanRow[] }) {
  const cols = ['Test / visit', 'How often', 'Next due', 'Status']
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th
                key={c}
                className={cn(
                  'border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground',
                  i === 0 && 'w-[62%]',
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const chip = statusChip(r)
            return (
              <tr key={`${r.test}-${i}`}>
                <td className="border-b border-border px-3 py-2.5 text-card-foreground">{r.test}</td>
                <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.freq}</td>
                <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.due}</td>
                <td className="border-b border-border px-3 py-2.5">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', CHIP[chip.kind])}>
                    {chip.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MyPlanScreen() {
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const model = useMemo(() => scpModel(patient.surv), [patient])

  /* Active treatment: nothing to summarise, and the plan is written AT the
     survivorship clinic visit. No clinical intervals are invented here — the
     follow-up rows below mirror buildRows()'s own defaults so the patient view
     and the admin generator cannot disagree.

     This is what the legacy app got right and is worth stating plainly: a
     patient still in treatment is told where they actually are, rather than
     shown a stranger's chart. Darlene is in active treatment, so this is the
     branch the demo opens on. */
  if (!model) {
    const rows: PlanRow[] = [
      { test: 'Last treatment cycle', freq: 'end of your planned course', due: '', status: 'on' },
      { test: 'Survivorship clinic visit — your plan is written here', freq: 'after treatment ends', due: '', status: 'on' },
      { test: 'Oncology follow-up visit', freq: 'every 6 months ×2, then annual', due: '', status: 'on' },
      { test: 'PCP handoff — annual wellness visit', freq: 'annual', due: '', status: 'on' },
    ]

    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <h3 className="text-lg font-semibold text-card-foreground">💚 Your care plan</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A survivorship care plan is written when treatment finishes — it summarises what you
            were treated with and what to watch for afterwards, in ASCO format. You are still in
            active treatment, so there is nothing to summarise yet. Your care team writes it with you
            at your survivorship clinic visit.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-[62%] border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                    Step
                  </th>
                  <th className="border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.test}>
                    <td className="border-b border-border px-3 py-2.5 text-card-foreground">{r.test}</td>
                    <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.freq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Your appointments are on the Calendar tab, and your care team is listed under My Care.
          </p>
        </section>
      </div>
    )
  }

  const { s, hits, rows } = model

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <h3 className="text-lg font-semibold text-card-foreground">💚 My survivorship plan</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This is your own care plan — what you were treated with, what to watch for, and when your
          next check-up is due. Print it or share it with your family and your primary-care doctor.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <b className="text-base font-semibold text-card-foreground">
            {s.name} · {s.age}
          </b>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            MRN {s.mrn} · {s.parish} Parish
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          <b className="text-card-foreground">{s.dx}</b>
          <br />
          Diagnosed {s.dxDate} · treatment completed {s.endDate}
        </p>

        <div className="mt-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-[62%] border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                  What your treatment involved
                </th>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                  Dates
                </th>
              </tr>
            </thead>
            <tbody>
              {s.treatments.map(([txt, dates], i) => (
                <tr key={i}>
                  <td className="border-b border-border px-3 py-2.5 text-card-foreground">{txt}</td>
                  <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{dates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mb-2 mt-5 text-base font-semibold text-card-foreground">What to keep an eye on</h4>
        <PlanTable rows={rows} />

        {/* Deliberately the plain-language lines, not the late-effects radar.
            The radar encodes risk tiers, which is a clinician triage instrument;
            the patient gets the same information as prose. */}
        <h4 className="mb-2 mt-5 text-base font-semibold text-card-foreground">Why we watch these</h4>
        <ul className="flex flex-col gap-2">
          {hits.map((h) => (
            <li key={h.cat} className="text-sm text-muted-foreground">
              <b className="text-card-foreground">{h.cat}</b> — {h.hit.note}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 rounded-md border border-border px-3.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            🖨️ Print my plan
          </button>
          <button
            type="button"
            onClick={() => toast('📤 Shared with your family and your primary-care doctor.')}
            className="h-9 rounded-md border border-border px-3.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            📤 Share with family
          </button>
        </div>
      </section>
    </div>
  )
}
