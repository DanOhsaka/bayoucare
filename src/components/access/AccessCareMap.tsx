import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, Info } from 'lucide-react'

import { ClinicCard, RouteSummary, TravelModeToggle } from '@/components/access/ClinicCards'
import { MapEmptyState, MapErrorState, MapLoadingState } from '@/components/access/MapStates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SELECT_CLASS } from '@/components/shared/Field'
import type { PatientId } from '@/data'
import type { TravelMode } from '@/data/demoHomes'
import {
  clinicsNearHome,
  getDemoHome,
  sortClinics,
  type NearbyClinic,
  type SortKey,
} from '@/engine/access/nearby'
import {
  fetchRoadRoute,
  formatMiles,
  formatMinutes,
  type RoadRoute,
} from '@/engine/access/geo'
import { cn } from '@/lib/utils'

const CareMapCanvas = lazy(() =>
  import('@/components/access/CareMapCanvas').then((m) => ({ default: m.CareMapCanvas })),
)

type LoadState = 'loading' | 'ready' | 'error'

/**
 * GPS-style nearby-care map for Access & Help.
 *
 * Selected routes follow real streets via OSRM. Clinic list distances remain
 * straight-line estimates for fast sorting.
 */
export function AccessCareMap({ patientId }: { patientId: PatientId }) {
  const home = useMemo(() => getDemoHome(patientId), [patientId])

  const [load, setLoad] = useState<LoadState>('loading')
  const [mode, setMode] = useState<TravelMode>('drive')
  const [sort, setSort] = useState<SortKey>('nearest')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wide, setWide] = useState(false)
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(null)
  const [routePending, setRoutePending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const routeClinicIdRef = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoad('loading')
    setSelectedId(null)
    setRoadRoute(null)
    setRoutePending(false)
    routeClinicIdRef.current = null
    const t = window.setTimeout(() => {
      if (!alive) return
      try {
        void getDemoHome(patientId)
        setLoad('ready')
      } catch {
        setLoad('error')
      }
    }, 280)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [patientId])

  const clinics = useMemo(() => {
    if (load !== 'ready') return [] as NearbyClinic[]
    return sortClinics(clinicsNearHome(home, mode, { wide }), sort)
  }, [home, mode, sort, load, wide])

  useEffect(() => {
    if (clinics.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((prev) => (prev && clinics.some((c) => c.id === prev) ? prev : clinics[0].id))
  }, [clinics])

  const selected = clinics.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) {
      setRoadRoute(null)
      setRoutePending(false)
      routeClinicIdRef.current = null
      return
    }
    const clinicChanged = routeClinicIdRef.current !== selected.id
    routeClinicIdRef.current = selected.id
    // Drop the prior clinic's path immediately; keep the path on Drive↔Walk so
    // distance/time don't snap back to the straight-line estimate mid-fetch.
    if (clinicChanged) setRoadRoute(null)
    setRoutePending(true)
    const ac = new AbortController()
    void fetchRoadRoute(home, selected, mode, ac.signal)
      .then((r) => {
        if (ac.signal.aborted) return
        setRoadRoute(r)
        setRoutePending(false)
      })
      .catch(() => {
        if (!ac.signal.aborted) setRoutePending(false)
      })
    return () => ac.abort()
  }, [home, selected, mode])

  function selectClinic(id: string) {
    setSelectedId(id)
    const el = listRef.current?.querySelector(`[data-clinic-id="${id}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0 space-y-1">
          <CardTitle className="typo-card-title flex items-center gap-2">
            <Crosshair className="size-4 text-muted-foreground" aria-hidden="true" strokeWidth={1.75} />
            Clinics near you
          </CardTitle>
          <p className="typo-muted">
            See healthcare options around your home area, compare distance and drive time, and
            preview a street route — like a GPS built for care.
          </p>
        </div>
        <Badge variant="neutral">Demo map · approximate location</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          <span>
            Home pin uses a <b className="font-semibold text-card-foreground">neighborhood</b>{' '}
            near {home.city} — not a street address. Selected routes follow real roads via
            OpenStreetMap routing (OSRM).
          </span>
        </div>

        {load === 'loading' && <MapLoadingState />}
        {load === 'error' && (
          <MapErrorState
            onRetry={() => {
              setLoad('loading')
              window.setTimeout(() => setLoad('ready'), 200)
            }}
          />
        )}

        {load === 'ready' && clinics.length === 0 && (
          <MapEmptyState onExpand={() => setWide(true)} />
        )}

        {load === 'ready' && clinics.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TravelModeToggle mode={mode} onChange={setMode} />
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                Sort
                <select
                  className={cn(SELECT_CLASS, 'h-9 w-auto lg:h-8')}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort clinics"
                >
                  <option value="nearest">Nearest</option>
                  <option value="fastest">Shortest travel time</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]">
              <div className="flex min-w-0 flex-col gap-3">
                <Suspense
                  fallback={
                    <div className="min-h-[320px] animate-pulse rounded-lg bg-muted lg:min-h-[440px]" />
                  }
                >
                  <CareMapCanvas
                    home={home}
                    clinics={clinics}
                    selectedId={selectedId}
                    onSelect={selectClinic}
                    route={roadRoute}
                    routePending={routePending}
                    className="h-[320px] border border-border shadow-[var(--shadow)] lg:h-[440px]"
                  />
                </Suspense>
                {selected ? (
                  <RouteSummary
                    fromLabel={`Patient home · ${home.label}`}
                    clinic={selected}
                    distanceLabel={
                      roadRoute ? formatMiles(roadRoute.distanceMiles) : selected.distanceLabel
                    }
                    etaLabel={
                      roadRoute ? formatMinutes(roadRoute.durationMinutes) : selected.etaLabel
                    }
                    pending={routePending}
                    routeNote={
                      routePending
                        ? mode === 'walk'
                          ? 'Recalculating walking time…'
                          : 'Recalculating driving route…'
                        : roadRoute?.source === 'osrm'
                          ? mode === 'walk'
                            ? 'Walking time is based on road distance (~3 mph).'
                            : 'Road distance and drive time from OpenStreetMap routing.'
                          : roadRoute?.source === 'fallback'
                            ? 'Live routing unavailable — showing an approximate path.'
                            : undefined
                    }
                  />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <p className="typo-label">
                  Nearby · {clinics.length} {clinics.length === 1 ? 'facility' : 'facilities'}
                </p>
                <div
                  ref={listRef}
                  className="flex max-h-[520px] flex-col gap-2.5 overflow-y-auto overscroll-contain pr-0.5"
                  role="listbox"
                  aria-label="Nearby clinics"
                >
                  {clinics.map((c) => (
                    <div
                      key={c.id}
                      data-clinic-id={c.id}
                      role="option"
                      aria-selected={c.id === selectedId}
                    >
                      <ClinicCard
                        clinic={c}
                        selected={c.id === selectedId}
                        onSelect={() => selectClinic(c.id)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="self-start font-semibold text-link"
                  onClick={() => setWide((w) => !w)}
                >
                  {wide ? 'Show closer clinics' : 'Expand search area'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
