import { Component, Suspense, lazy, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Printer, Radar, Send, Users } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/motion/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { RichText } from '@/components/shared/RichText'
import { Stagger, StaggerItem } from '@/components/shared/Motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SURVIVOR_IDS } from '@/data'
import { buildLetter } from '@/engine/survivorship/letter'
import { scpModel, statusChip } from '@/engine/survivorship/planRows'
import { cn } from '@/lib/utils'

/*
 * Recharts is ~112 kB gzipped and ONLY this screen needs it, so it is loaded on
 * demand rather than shipped in the initial bundle. Imported eagerly, it took
 * the bundle from 773 kB to 1,106 kB — which would have quietly undone the boot
 * shell work that got the first paint down to ~250ms, on an app that pitches
 * itself as working in rural Louisiana on a slow connection.
 */
const LateEffectsRadar = lazy(() =>
  import('@/components/shared/LateEffectsRadar').then((m) => ({ default: m.LateEffectsRadar })),
)

/** Matches chart + summary + value-list footprint so the card does not jump. */
function RadarSkeleton() {
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-4" aria-hidden="true">
      <Skeleton className="mx-auto aspect-square w-full max-w-[280px] rounded-full" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Skeleton className="h-14 rounded-md" />
        <Skeleton className="h-14 rounded-md" />
        <Skeleton className="h-14 rounded-md" />
      </div>
      <div className="space-y-2 rounded-md border border-border p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[90%]" />
      </div>
    </div>
  )
}

type BoundaryProps = { children: ReactNode; resetKey: string }
type BoundaryState = { error: boolean }

/**
 * Catches a failed Recharts chunk load. There is no async radar API — this is
 * the only realistic failure mode for the lazy import.
 */
class RadarErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: false }

  static getDerivedStateFromError(): BoundaryState {
    return { error: true }
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: false })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
          <div className="space-y-1">
            <p className="typo-card-title">Couldn’t load the late-effects chart</p>
            <p className="typo-muted">
              Something went wrong while loading the chart. Your care plan tables below are still
              available.
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => this.setState({ error: false })}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

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
  const navigate = useNavigate()

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
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 py-6">
      <PageHeader
        title="Survivorship Care Plans"
        subtitle={
          <>
            ASCO-format summary, follow-up schedule, and PCP letter — generated from the treatment
            record — plus a late-effects radar that turns treatment exposures into a concrete
            surveillance schedule.
          </>
        }
        meta={
          <Badge variant="neutral" className="text-left whitespace-normal">
            ~350,000 LA survivors · largest population the brief names
          </Badge>
        }
      />

      {/* Full-width picker — never share a row with the page title (flex crush). */}
      <div className="flex w-full min-w-0 flex-col gap-2">
        <span className="typo-label">Demo survivor</span>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <Stagger className="grid w-full min-w-0 gap-4 md:grid-cols-2">
        {/* ------------------------------------------------------- summary */}
        <StaggerItem className="min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="typo-card-title flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" strokeWidth={1.75} />
              {s.name} · {s.age}
            </CardTitle>
            <Badge variant="success">
              MRN {s.mrn} · {s.parish} Parish
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="typo-muted">
              <b className="text-card-foreground">{s.dx}</b>
              <br />
              Diagnosed {s.dxDate} · treatment completed {s.endDate} · survivorship since{' '}
              {s.survivorSince}
            </p>

            <DataTable
              data={s.treatments.map(([treatment, dates], i) => ({
                id: String(i),
                treatment,
                dates,
              }))}
              getRowId={(row) => row.id}
              showCount={false}
              height={280}
              columns={[
                {
                  key: 'treatment',
                  header: 'Treatment summary (ASCO SCP Section 1)',
                  sortable: true,
                  title: (row) => row.treatment,
                  cell: (row) => (
                    <span className="text-card-foreground">{row.treatment}</span>
                  ),
                },
                {
                  key: 'dates',
                  header: 'Dates',
                  sortable: true,
                  title: (row) => row.dates,
                  cell: (row) => (
                    <span className="text-muted-foreground">{row.dates}</span>
                  ),
                },
              ]}
            />

            <p className="typo-meta">
              Auto-generated from the treatment record — no typing. Reviewed at the survivorship
              clinic visit.
            </p>
          </CardContent>
        </Card>
        </StaggerItem>

        {/* ---------------------------------------------------------- radar */}
        <StaggerItem className="min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="typo-card-title flex items-center gap-2">
              <Radar className="size-4 text-muted-foreground" aria-hidden="true" strokeWidth={1.75} />
              Late-effects radar
            </CardTitle>
            <Badge variant="warning">{hits.length} active risk rules · treatment-driven</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <RadarErrorBoundary resetKey={survSel} key={survSel}>
                  <Suspense fallback={<RadarSkeleton />}>
                    <LateEffectsRadar hits={hits} selected={radarSel} onSelect={setRadarSel} />
                  </Suspense>
                </RadarErrorBoundary>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <p className="typo-label">Surveillance categories</p>
                <div className="flex flex-col gap-2.5">
                  {hits.map((h) => (
                    <Button
                      key={h.cat}
                      type="button"
                      variant="outline"
                      aria-pressed={radarSel === h.cat}
                      onClick={() => setRadarSel(radarSel === h.cat ? null : h.cat)}
                      className={cn(
                        // h-auto alone loses to size=default's lg:h-9 — the two-
                        // line label was getting crushed to 36px on desktop.
                        'h-auto min-h-11 lg:h-auto flex-col items-start justify-start gap-1 px-3 py-2.5 text-left font-normal whitespace-normal',
                        radarSel === h.cat && 'border-brand-600 bg-accent',
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <b className="text-sm text-card-foreground">{h.cat}</b>
                        <Badge variant={TIER_VARIANT[h.hit.t] ?? 'success'}>
                          {TIER_TEXT[h.hit.t]} risk
                        </Badge>
                      </span>
                      <span className="block text-xs leading-snug text-muted-foreground">
                        {h.hit.test} · {h.hit.freq}
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="rounded-md bg-muted p-3 typo-muted">
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
                    'Select a category for the surveillance detail.'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>
      </Stagger>

      {/*
        `lg`, not `md`: this pair is a four-column data table and a page-width
        letter. Two columns at 768–1023 left the table 336px against the 397px it
        needs, so it scrolled sideways inside its own card. Full width until
        there is room for two.
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------------ schedule */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="typo-card-title">Follow-up care plan</CardTitle>
            <Badge variant="success">ASCO SCP Section 2</Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              data={rows}
              getRowId={(r, i) => `${r.test}-${i}`}
              height={360}
              defaultSort={{ key: 'due', direction: 'asc' }}
              columns={[
                {
                  key: 'test',
                  header: 'Test / visit',
                  sortable: true,
                  title: (r) => r.test,
                  cell: (r) => <span className="text-card-foreground">{r.test}</span>,
                },
                {
                  key: 'freq',
                  header: 'Frequency',
                  cell: (r) => <span className="text-muted-foreground">{r.freq}</span>,
                },
                {
                  key: 'due',
                  header: 'Next due',
                  sortable: true,
                  cell: (r) => <span className="text-muted-foreground">{r.due}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  cell: (r) => {
                    const c = statusChip(r)
                    return <Badge variant={c.kind}>{c.label}</Badge>
                  },
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* -------------------------------------------------------- letter */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="typo-card-title">PCP handoff letter</CardTitle>
            <CardAction>
              <Button
                type="button"
                size="xs"
                onClick={() => window.print()}
                className="font-bold"
              >
                <Printer className="size-3.5" aria-hidden="true" strokeWidth={2} />
                Print SCP
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => toast('SCP sent to the PCP clinic via secure fax + portal.')}
                className="font-bold"
              >
                <Send className="size-3.5" aria-hidden="true" strokeWidth={2} />
                Share with PCP
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  toast('Care plan shared with family helpers.')
                  navigate('/my-care/family')
                }}
                className="font-bold"
              >
                <Users className="size-3.5" aria-hidden="true" strokeWidth={2} />
                Share with family
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            <RichText
              html={buildLetter(s, hits)}
              className="typo-body block whitespace-pre-line leading-relaxed"
            />

            <p className="typo-meta">
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
