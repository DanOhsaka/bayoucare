import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { DataTable } from '@/components/motion/table'
import { ParishChoroplethMap } from '@/components/population/ParishChoroplethMap'
import { ProgressTrack } from '@/components/shared/ProgressTrack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  METRICS,
  PARISH_DATA,
  bucketOf,
  followAction,
  outreachAction,
  parishResults,
  sideAction,
  type MetricKey,
  type ParishRow,
} from '@/engine/population/parishes'
import { PARISH_CARE } from '@/lib/parishGeo'
import { useInterval } from '@/hooks/useInterval'
import { cn } from '@/lib/utils'

/** Quintile ramp. Index 0 is the suppressed bucket — a neutral tile, never a
 *  fabricated colour for a parish whose late-stage data the LTR rules withheld.
 *  A single sequential ramp, so it is not a `Badge` variant set. */
const SCALE = [
  'bg-muted text-muted-foreground',
  'bg-brand-50 text-on-brand-tint',
  'bg-brand-100 text-on-brand-tint',
  'bg-warning-bg text-warning-fg',
  'bg-warning text-on-warning',
  'bg-danger text-on-danger',
]

const METRIC_KEYS: MetricKey[] = ['need', 'late', 'inc', 'cov']

/**
 * The quintile ramp legend, rendered under BOTH map modes.
 *
 * One component rather than a copy per mode, so the cartogram and the geographic
 * map cannot drift apart. The end labels come from `METRICS[metric]` rather than
 * a hard-coded phrase: `worse` is what flips them, so the need index reads
 * "lower … higher" while Screening coverage correctly reads "higher … lower".
 * The caption is the only mode-dependent part, because "each tile is one parish"
 * and the numbered rank badges describe the cartogram and nothing else.
 */
function MapLegend({ metric, mode }: { metric: MetricKey; mode: 'tiles' | 'geo' }) {
  const m = METRICS[metric]

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {m.worse ? 'lower' : 'higher'} {m.label.toLowerCase()}
        </span>
        {SCALE.map((c, i) => (
          <span key={i} className={cn('block size-3.5 rounded-sm', c)} aria-hidden="true" />
        ))}
        <span>
          {m.worse ? 'higher' : 'lower'} {m.label.toLowerCase()}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {mode === 'tiles'
          ? 'Tile cartogram — each tile is one parish; positions approximate geography. Numbered badges = top-10 unmet-need rank.'
          : 'Geographic map — continental United States context with Louisiana parish choropleth. Hover/click parishes for detail; United States / Louisiana buttons reframe the camera.'}{' '}
        <b className="text-card-foreground">
          Incidence &amp; late-stage: State Cancer Profiles / USCS. Screening coverage &amp;
          population: CDC PLACES 2025. {mode === 'tiles' ? 'Hatched tiles' : 'Muted parishes'} = late
          stage suppressed (&lt;16 cases).
        </b>
      </p>
    </>
  )
}

export function PopulationScreen() {
  const [metric, setMetric] = useState<MetricKey>('need')
  const [mode, setMode] = useState<'tiles' | 'geo'>('tiles')
  const [parish, setParish] = useState<string | null>(null)
  const [vanHere, setVanHere] = useState<string | null>(null)

  // The van tour, at the app root of this screen and cleaned up on unmount —
  // the legacy ran it un-cleared, so it kept advancing after you navigated away.
  const [tourStop, setTourStop] = useState<number | null>(null)
  const [tourLog, setTourLog] = useState<string[]>([])

  const stops = useMemo(() => PARISH_DATA.filter((p) => p.rank != null).slice(0, 10), [])

  useInterval(
    () => {
      if (tourStop == null) return
      if (tourStop >= stops.length) {
        setTourStop(null)
        toast('Van tour complete — 10 parishes routed by unmet need.')
        return
      }
      const p = stops[tourStop]
      setVanHere(p.n)
      setParish(p.n)
      setTourLog((l) => [
        ...l,
        `Stop ${tourStop + 1}/10 — ${p.n} — ${p.late}% late-stage · ${p.uns.toLocaleString()} unscreened · rank #${p.rank}`,
      ])
      setTourStop(tourStop + 1)
    },
    tourStop != null ? 900 : null,
  )

  const m = METRICS[metric]
  const selected = parish ? (PARISH_DATA.find((p) => p.n === parish) ?? null) : null
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Parish heat index — where screening matters most
          </CardTitle>
          <Badge variant="success" className="text-left whitespace-normal">
           All 64 parishes · State Cancer Profiles + CDC PLACES
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
           All 64 parishes scored on incidence, late-stage share, coverage, and unmet need — so
            screening vans and SMS nudges go to the{' '}
            <b className="text-card-foreground">highest-burden parishes, not just the biggest cities</b>.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Louisiana, by the numbers</CardTitle>
          <CardAction>
            {METRIC_KEYS.map((k) => (
              <Button
                key={k}
                type="button"
                size="xs"
                variant={metric === k ? 'default' : 'outline'}
                aria-pressed={metric === k}
                onClick={() =>setMetric(k)}
                className="rounded-full px-2.5 font-bold"
              >
                {METRICS[k].label}
              </Button>
            ))}
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant={mode === 'tiles' ? 'default' : 'outline'}
                  aria-pressed={mode === 'tiles'}
                  onClick={() =>setMode('tiles')}
                  className="rounded-full px-2.5 font-bold"
                >
                  Tile cartogram
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={mode === 'geo' ? 'default' : 'outline'}
                  aria-pressed={mode === 'geo'}
                  onClick={() =>setMode('geo')}
                  className="rounded-full px-2.5 font-bold"
                >
                  Geographic map
                </Button>
              </div>

              {mode === 'tiles' ? (
                /*
                 * Cartogram: fixed 12-col grid with per-tile grid-column/row from
                 * parish data. `min-w` keeps squares ≥48px on phones (scroll if needed).
                 * aspect-square + no default button chrome avoids the white-border flash.
                 */
                <div className="max-w-[760px] overflow-x-auto pb-1">
                  <div
                    className="grid min-w-[640px] grid-cols-12 gap-1"
                    role="group"
                    aria-label="Louisiana parish tile cartogram"
                  >
                    {PARISH_DATA.map((p) => {
                      const b = bucketOf(p, metric)
                      const v = m.f(p)
                      const valTxt = v == null ? 'suppressed (<16 cases)' : m.fmt(v)
                      const rankTxt = m.worse && p.rank != null ? ` · unmet-need rank #${p.rank}` : ''
                      return (
                        <button
                          key={p.n}
                          type="button"
                          aria-pressed={parish === p.n}
                          aria-label={`${p.n} — ${valTxt}${rankTxt}`}
                          title={`${p.n} — ${valTxt}${rankTxt}`}
                          onClick={() => setParish(p.n)}
                          style={{ gridColumn: p.x, gridRow: p.y }}
                          className={cn(
                            'relative aspect-square appearance-none border-0 outline-none',
                            'flex items-center justify-center rounded-md text-[11px] font-bold tracking-wide',
                            'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] duration-150',
                            'hover:z-10 hover:scale-110 hover:shadow-[var(--shadow-sm)]',
                            'focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            SCALE[b],
                            parish === p.n && 'z-10 ring-2 ring-brand-700 ring-offset-1 ring-offset-background',
                            vanHere === p.n && 'z-10 ring-2 ring-warning',
                          )}
                        >
                          {p.rank != null && p.rank <= 10 && (
                            <span
                              aria-hidden="true"
                              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand-700 text-[10px] leading-none text-on-dark"
                            >
                              {p.rank}
                            </span>
                          )}
                          <span aria-hidden="true">{p.ab}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <ParishChoroplethMap
                  metric={metric}
                  selected={parish}
                  vanHere={vanHere}
                  onSelect={setParish}
                />
              )}

              {/* One legend for both modes — see `MapLegend` above. */}
              <MapLegend metric={metric} mode={mode} />
            </div>

            {/* ------------------------------------------------ side panel */}
            <Card>
              <CardHeader>
                <CardTitle>{selected ? `${selected.n} Parish` : '—'}</CardTitle>
                <Badge
                  variant={selected?.rank != null && selected.rank <= 10 ? 'danger' : 'neutral'}
                  className="text-left whitespace-normal"
                >
                  {selected
                    ? selected.rank != null
                      ? `#${selected.rank} of ${PARISH_DATA.filter((x) => x.rank != null).length} ranked by unmet need`
                      : 'Not ranked — late-stage data suppressed'
                    : 'pick a parish'}
                </Badge>
              </CardHeader>

              <CardContent>
                {selected && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        ['Population', selected.pop.toLocaleString()],
                        ['Incidence /100k', String(selected.inc)],
                        [
                          'Late-stage share',
                          selected.late == null ? 'suppressed' : `${selected.late}%`,
                        ],
                        ['Screening coverage', `${selected.cov}%`],
                        ['Eligible & unscreened', `≈ ${selected.uns.toLocaleString()}`],
                        [
                          'Need index',
                          selected.need == null ? '—' : selected.need.toFixed(1),
                        ],
                        [
                          'Care sites in parish',
                          String(PARISH_CARE[selected.n]?.clinicCount ?? 0),
                        ],
                        [
                          'Nearest care',
                          PARISH_CARE[selected.n]?.nearest
                            ? `${PARISH_CARE[selected.n]!.nearest!.miles} mi`
                            : '—',
                        ],
                        ['30-day action', sideAction(selected)],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <span className="block text-xs text-muted-foreground">{k}</span>
                          <span className="block font-bold text-card-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                    {PARISH_CARE[selected.n]?.nearest ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Nearest:{' '}
                        <b className="text-card-foreground">
                          {PARISH_CARE[selected.n]!.nearest!.facility.name}
                        </b>
                      </p>
                    ) : null}
                    {(PARISH_CARE[selected.n]?.clinicsInParish.length ?? 0) > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {PARISH_CARE[selected.n]!.clinicsInParish.map((c) => (
                          <li key={c.id}>
                            <b className="text-card-foreground">{c.name}</b>
                            <span className="text-muted-foreground"> · {c.services.join(', ')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="xs"
                    className="font-bold"
                    onClick={() => {
                      if (!selected) return toast('Pick a parish on the map first.')
                      setVanHere(selected.n)
                      toast(`Van routed to ${selected.n} — mobile screening unit arrives Saturday.`)
                    }}
                  >
                    Route van here
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="font-bold"
                    onClick={() => {
                      if (!selected) return toast('Pick a parish on the map first.')
                      toast(
                        ` ${selected.uns.toLocaleString()} un-screened adults queued for SMS nudges (event invites + LA Quitline) in ${selected.n}.`,
                      )
                    }}
                  >
                    SMS nudge cohort
                  </Button>
                  {selected ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      className="font-bold"
                      onClick={() => setParish(null)}
                    >
                      Clear focus
                    </Button>
                  ) : null}
                </div>

                <div className="mt-3 max-h-[140px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs leading-relaxed text-on-dark">
                  {tourLog.length === 0 ? (
                    <span className="text-on-dark-muted">
                     Van tour log — deploy to the top-10 parishes to watch routing live.
                    </span>
                  ) : (
                    tourLog.map((l, i) => <div key={i}>{l}</div>)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------ outreach queue */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Risk-stratified outreach queue</CardTitle>
          <Badge variant="warning" className="text-left whitespace-normal">
           screening vans · SMS · CHW visits — top 8 parishes by unmet need
          </Badge>
          <CardAction>
            <Button
              type="button"
              size="xs"
              className="font-bold"
              onClick={() =>{
                if (tourStop != null) {
                  setTourStop(null)
                  toast('Van tour stopped.')
                } else {
                  setTourLog([])
                  setTourStop(0)
                }
              }}
            >
              {tourStop != null ? 'Stop tour' : 'Deploy van to top-10'}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <DataTable
            data={top8}
            getRowId={(p) => p.n}
            height={420}
            rowHeight={64}
            defaultSort={{ key: 'uns', direction: 'desc' }}
            columns={[
              {
                key: 'n',
                header: 'Parish',
                sortable: true,
                truncate: false,
                title: (p) => `${p.rank}. ${p.n} Parish`,
                cell: (p) => (
                  <>
                    <b className="text-card-foreground">
                      {p.rank}. {p.n} Parish
                    </b>
                    <div className="text-xs text-muted-foreground">
                      {p.late == null ? 'late-stage suppressed' : `${p.late}% late-stage`} ·{' '}
                      {p.cov}% screened
                    </div>
                  </>
                ),
              },
              {
                key: 'uns',
                header: 'Unscreened',
                sortable: true,
                truncate: false,
                sortValue: (p) => p.uns,
                cell: (p) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Unscreened</span>
                    <b className="text-card-foreground">{p.uns.toLocaleString()}</b>
                  </>
                ),
              },
              {
                key: 'cov',
                header: 'Coverage gap',
                sortable: true,
                truncate: false,
                sortValue: (p) => 100 - p.cov,
                cell: (p) => (
                  <>
                    <span className="block text-xs text-muted-foreground">Coverage gap</span>
                    <b className="text-card-foreground">{(100 - p.cov).toFixed(0)}%</b>
                  </>
                ),
              },
              {
                key: 'action',
                header: 'Outreach',
                align: 'right',
                truncate: false,
                title: (p) => outreachAction(p).label,
                cell: (p) => {
                  const a = outreachAction(p)
                  return <Badge variant={a.tone}>{a.label}</Badge>
                },
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ------------------------------------------- follow-up + FIT kits */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FollowQueue selected={selected} />
        <FitTracking selected={selected} />
      </div>
    </div>
  )
}

function FollowQueue({ selected }: { selected: ParishRow | null }) {
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)
  const scope = selected ? [selected] : top8
  const totals = scope.reduce(
    (acc, p) => {
      const f = parishResults(p)
      acc.abnormal += f.abnormal
      acc.overdue += f.overdue
      return acc
    },
    { abnormal: 0, overdue: 0 },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>14-day abnormal-result follow-up queue</CardTitle>
        <Badge variant="warning">Rank 4 extension · brief area 4</Badge>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-card-foreground">
          {selected
            ? `Scoped to ${selected.n} Parish — ${totals.abnormal} abnormal results in the window.`
            : `Top 8 parishes — ${totals.abnormal} abnormal results, ${totals.overdue} past the 14-day window.`}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {scope.map((p) => {
            const f = parishResults(p)
            const a = followAction(f)
            return (
              <div key={p.n} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-card-foreground">{p.n}</b>
                  <div className="text-xs text-muted-foreground">
                    {f.abnormal} abnormal · {f.overdue} overdue · {f.lag}-day lag
                  </div>
                </div>
                <Badge variant={a.tone}>{a.label}</Badge>
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
         Screening only helps if an abnormal result actually gets followed up. This queue comes from
          the same parish need model — pick any parish on the map or the tiles to re-scope it.
        </p>
      </CardContent>
    </Card>
  )
}

function FitTracking({ selected }: { selected: ParishRow | null }) {
  const top8 = PARISH_DATA.filter((p) => p.rank != null).slice(0, 8)
  const scope = selected ? [selected] : top8

  return (
    <Card>
      <CardHeader>
        <CardTitle>FIT kit return tracking</CardTitle>
        <Badge variant="neutral">
         mailed stool kits · {selected ? selected.n : 'top 8 parishes'}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          {scope.map((p) => {
            const f = parishResults(p)
            const pct = Math.round(f.fitRate * 100)
            return (
              <div key={p.n} className="flex items-center gap-3">
                <span className="w-28 flex-none truncate text-sm text-card-foreground">{p.n}</span>
                <ProgressTrack
                  pct={pct}
                  tone={pct < 40 ? 'danger' : pct < 55 ? 'warning' : 'brand'}
                  width="w-24"
                  valueText={`${f.fitBack.toLocaleString()}/${f.fitSent.toLocaleString()} · ${pct}%`}
                />
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
         FIT kits need no appointment and no bowel prep — for a rural patient that is often the
          difference between screened and not. The return rate drives the escalation in the queue
          beside it.
        </p>
      </CardContent>
    </Card>
  )
}
