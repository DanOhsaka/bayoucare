import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  MessageCircle,
  Printer,
  Share2,
  Stethoscope,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PATIENTS } from '@/data'
import { scpModel, statusChip, type PlanRow } from '@/engine/survivorship/planRows'
import { cn } from '@/lib/utils'
import { usePatient } from '@/store/patient'

const STATUS_ORDER: Record<PlanRow['status'], number> = {
  over: 0,
  soon: 1,
  on: 2,
  doc: 3,
}

function sortRows(rows: PlanRow[]) {
  return [...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
}

function WatchCard({
  row,
  note,
  open,
  onToggle,
  onSchedule,
}: {
  row: PlanRow
  note?: string
  open: boolean
  onToggle: () => void
  onSchedule: () => void
}) {
  const chip = statusChip(row)
  const urgent = row.status === 'over' || row.status === 'soon'

  return (
    <div
      className={cn(
        'rounded-lg border bg-card transition-colors',
        urgent ? 'border-warning/50' : 'border-border',
        row.status === 'over' && 'border-danger/50 bg-danger-bg/30',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-3.5 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className={cn(
            'mt-0.5 flex size-9 flex-none items-center justify-center rounded-md',
            row.status === 'over'
              ? 'bg-danger-bg text-danger-fg'
              : row.status === 'soon'
                ? 'bg-warning-bg text-warning-fg'
                : 'bg-accent text-accent-foreground',
          )}
        >
          <Stethoscope className="size-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-card-foreground">{row.test}</p>
            <Badge variant={chip.kind} className="whitespace-normal">
              {chip.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.freq}
            {row.due && row.due !== 'ongoing' ? ` · Next: ${row.due}` : null}
          </p>
        </div>

        <ChevronDown
          className={cn(
            'mt-1 size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3.5 py-3">
          {note ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Part of your regular follow-up with oncology and primary care.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {urgent ? (
              <Button type="button" size="sm" className="font-semibold" onClick={onSchedule}>
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Schedule visit
              </Button>
            ) : null}
            <Button asChild type="button" size="sm" variant="outline" className="font-semibold">
              <Link to="/my-care/messages">
                <MessageCircle className="size-3.5" aria-hidden="true" />
                Ask care team
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PlanActions({
  onPrint,
  onShare,
}: {
  onPrint: () => void
  onShare: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" className="font-semibold" onClick={onPrint}>
        <Printer className="size-3.5" aria-hidden="true" />
        Print
      </Button>
      <Button type="button" variant="outline" size="sm" className="font-semibold" onClick={onShare}>
        <Share2 className="size-3.5" aria-hidden="true" />
        Share
      </Button>
      <Button asChild type="button" size="sm" className="font-semibold">
        <Link to="/my-care/calendar">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Appointments
        </Link>
      </Button>
    </div>
  )
}

/** Active-treatment patients: clear path, not a fake survivorship chart. */
function ActiveTreatmentPlan({ name }: { name: string }) {
  const steps = [
    {
      title: 'Finish your planned treatment',
      detail: 'Stay on the schedule your oncology team set.',
      to: '/my-care/calendar',
      cta: 'View appointments',
    },
    {
      title: 'Survivorship clinic visit',
      detail: 'Your written care plan is created here after treatment ends.',
      to: '/my-care/messages',
      cta: 'Message navigator',
    },
    {
      title: 'Ongoing follow-up',
      detail: 'Oncology visits every 6 months ×2, then annual — plus PCP wellness.',
      to: '/my-care/calendar',
      cta: 'Open calendar',
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      <PageHeader
        title="Your care plan"
        subtitle={`${name.split(' ')[0]}, you're still in active treatment. Your survivorship plan is written when treatment finishes — here's what comes next.`}
        action={<PlanActions onPrint={() => window.print()} onShare={() => toast('Shared with your care team.')} />}
      />

      <Card className="min-w-0 p-4 sm:p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
            What happens next
          </CardTitle>
          <Badge variant="info">Active treatment</Badge>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-0">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-on-dark">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-card-foreground">{step.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="w-full font-semibold sm:w-auto">
                <Link to={step.to}>{step.cta}</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function MyPlanScreen() {
  const navigate = useNavigate()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const model = useMemo(() => scpModel(patient.surv), [patient])
  const [openKey, setOpenKey] = useState<string | null>(null)

  if (!model) {
    return <ActiveTreatmentPlan name={patient.name} />
  }

  const { s, hits, rows } = model
  const sorted = sortRows(rows)
  const notesByTest = new Map(hits.map((h) => [h.hit.test, h.hit.note]))
  const attention = sorted.filter((r) => r.status === 'over' || r.status === 'soon')
  const firstName = s.name.split(' ')[0]

  function schedule() {
    toast('Opening your calendar to book a visit.')
    navigate('/my-care/calendar')
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <PageHeader
        title="My plan"
        subtitle={`A clear picture of your treatment and what to watch for next, ${firstName}.`}
        action={
          <PlanActions
            onPrint={() => window.print()}
            onShare={() => {
              toast('Shared with your family and primary-care doctor.')
              navigate('/my-care/family')
            }}
          />
        }
      />

      {/* Identity */}
      <Card className="min-w-0 gap-4 p-4 sm:p-5">
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0 space-y-1">
            <p className="text-balance text-lg font-semibold text-card-foreground">
              {s.name}
              <span className="font-normal text-muted-foreground"> · {s.age}</span>
            </p>
            <p className="text-sm font-medium text-card-foreground">{s.dx}</p>
            <p className="text-pretty text-xs text-muted-foreground">
              Diagnosed {s.dxDate} · Completed {s.endDate} · Survivorship since {s.survivorSince}
            </p>
          </div>
          <Badge variant="success" className="w-fit whitespace-normal">
            MRN {s.mrn} · {s.parish} Parish
          </Badge>
        </div>
      </Card>

      {attention.length > 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning-bg/40 px-3.5 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="size-4 text-warning-fg" aria-hidden="true" />
              <p className="text-sm font-semibold text-warning-fg">
                {attention.length} item{attention.length === 1 ? '' : 's'} need attention
              </p>
            </div>
            <Button type="button" size="sm" className="font-semibold" onClick={schedule}>
              Schedule now
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Treatment timeline */}
        <Card className="min-w-0 gap-3 p-4 sm:p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">Your treatment</CardTitle>
            <Badge variant="neutral">{s.treatments.length} steps</Badge>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ol className="relative space-y-0 border-l border-border ml-3">
              {s.treatments.map(([txt, dates], i) => (
                <li key={i} className="relative pb-4 pl-5 last:pb-0">
                  <span
                    className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-brand-600 ring-4 ring-card"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium leading-snug text-card-foreground">{txt}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{dates}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Watch list */}
        <Card className="min-w-0 gap-3 p-4 sm:p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">What to watch</CardTitle>
            <Badge variant="warning">{sorted.length} follow-ups</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 px-0 pb-0">
            {sorted.map((row, i) => {
              const key = `${row.test}-${i}`
              return (
                <WatchCard
                  key={key}
                  row={row}
                  note={notesByTest.get(row.test) ?? row.note}
                  open={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                  onSchedule={schedule}
                />
              )
            })}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Reviewed with your survivorship clinic.
      </p>
    </div>
  )
}
