import { AnimatePresence } from 'motion/react'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Cross, Hospital } from 'lucide-react'
import { toast } from 'sonner'

import { Map3DPin } from '@/components/ui/3d-pin'
import {
  Map as MapCN,
  MapControls,
  MapGeoJSON,
  MapMarker,
  MapPopup,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MarkerTooltip,
  useMap,
} from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import laParishes from '@/data/la-parishes.json'
import usStates from '@/data/us-states.json'
import usStateLabels from '@/data/us-state-labels.json'
import cancerFacilities from '@/data/cancerFacilities.json'
import {
  METRICS,
  PARISH_DATA,
  bucketOf,
  type MetricKey,
  type ParishRow,
} from '@/engine/population/parishes'
import {
  PARISH_CARE,
  PARISH_CENTROIDS,
  parishFeatureByName,
} from '@/lib/parishGeo'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'
type Frame = 'us' | 'la'

/** Continental US framing (AK/HI/PR stay drawn but outside this camera). */
const US_CENTER: [number, number] = [-97.5, 38.5]
const US_ZOOM = 3.55
const US_PITCH = 10

const LA_CENTER: [number, number] = [-91.85, 31.05]
const LA_ZOOM = 6.15
const FOCUS_ZOOM = 7.4
const FOCUS_PITCH = 42
const DEFAULT_PITCH = 18

/** Concrete hex — MapLibre paint cannot read CSS variables. */
const BUCKET_FILL: Record<Theme, string[]> = {
  light: ['#e8e8e6', '#eefbf4', '#d8f5e8', '#fdf3d9', '#e8a317', '#e05a3c'],
  dark: ['#2a2a2a', '#10241c', '#143528', '#3a2c12', '#e8a317', '#f07158'],
}

const STROKE: Record<Theme, string> = {
  light: 'rgba(15, 20, 18, 0.28)',
  dark: 'rgba(255, 255, 255, 0.22)',
}

const BRAND: Record<Theme, string> = {
  light: '#149567',
  dark: '#34d399',
}

const STATE_FILL: Record<Theme, string> = {
  light: '#dfe6e2',
  dark: '#1c2220',
}

const STATE_LINE: Record<Theme, string> = {
  light: 'rgba(15, 20, 18, 0.22)',
  dark: 'rgba(255, 255, 255, 0.16)',
}

type ParishProps = {
  parishname: string
  parishcode: string
  bucket: number
  name: string
  selected: number
  active: number
}

type StateProps = {
  name: string
  isLouisiana: number
}

type HoverInfo = {
  name: string
  lng: number
  lat: number
  row: ParishRow
}

function facilityIcon(kind: string) {
  if (kind === 'ochsner') return Cross
  if (kind === 'cancer') return Building2
  return Hospital
}

function facilityTone(kind: string) {
  if (kind === 'ochsner') return 'bg-brand-600 text-on-dark ring-brand-500/50'
  if (kind === 'cancer') return 'bg-amber-500 text-on-warning ring-amber-400/40'
  return 'bg-card text-foreground ring-border'
}

/** Ease camera: parish focus → Louisiana frame → United States overview. */
function CameraFocus({ selected, frame }: { selected: string | null; frame: Frame }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return

    if (selected) {
      const c = PARISH_CENTROIDS[selected]
      if (!c) return
      map.easeTo({
        center: c,
        zoom: FOCUS_ZOOM,
        pitch: FOCUS_PITCH,
        bearing: 0,
        duration: 560,
        essential: true,
      })
      return
    }

    if (frame === 'la') {
      map.easeTo({
        center: LA_CENTER,
        zoom: LA_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: 0,
        duration: 560,
        essential: true,
      })
      return
    }

    map.easeTo({
      center: US_CENTER,
      zoom: US_ZOOM,
      pitch: US_PITCH,
      bearing: 0,
      duration: 620,
      essential: true,
    })
  }, [map, isLoaded, selected, frame])

  return null
}

/** Soft fill-extrusion so the selected parish reads as lifted above neighbors. */
function SelectedExtrusion({
  selected,
  theme,
}: {
  selected: string | null
  theme: Theme
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return

    const sourceId = 'bc-parish-extrude-src'
    const layerId = 'bc-parish-extrude-layer'
    const feat = selected ? parishFeatureByName(selected) : null
    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: feat
        ? [
            {
              type: 'Feature',
              properties: { ...feat.properties },
              geometry: feat.geometry,
            },
          ]
        : [],
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data })
    } else {
      ;(map.getSource(sourceId) as GeoJSONSource).setData(data)
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': BRAND[theme],
          'fill-extrusion-opacity': 0.55,
          'fill-extrusion-height': selected ? 28000 : 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-vertical-gradient': true,
        },
      })
    } else {
      map.setPaintProperty(layerId, 'fill-extrusion-color', BRAND[theme])
      map.setPaintProperty(layerId, 'fill-extrusion-height', selected ? 28000 : 0)
      map.setPaintProperty(layerId, 'fill-extrusion-opacity', selected ? 0.55 : 0)
    }
  }, [map, isLoaded, selected, theme])

  useEffect(() => {
    return () => {
      if (!map) return
      try {
        if (map.getLayer('bc-parish-extrude-layer')) map.removeLayer('bc-parish-extrude-layer')
        if (map.getSource('bc-parish-extrude-src')) map.removeSource('bc-parish-extrude-src')
      } catch {
        /* map already torn down */
      }
    }
  }, [map])

  return null
}

/** Empty-map click + Escape clear selection (keeps current US/LA frame). */
function SelectionChrome({
  selected,
  onClear,
}: {
  selected: string | null
  onClear: () => void
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return
    const onClick = (e: MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null
      if (target?.closest?.('.maplibregl-marker, .maplibregl-popup')) return
      const hits = map.queryRenderedFeatures(e.point)
      const hitParish = hits.some((f) => typeof f.properties?.parishname === 'string')
      if (!hitParish && selected) onClear()
    }
    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
    }
  }, [map, isLoaded, selected, onClear])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) onClear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, onClear])

  return null
}

/**
 * MapCN / MapLibre map: continental US context + Louisiana parish choropleth.
 * Hover/select/3D pin behavior stays parish-level for Louisiana only.
 */
export function ParishChoroplethMap({
  metric,
  selected,
  vanHere,
  onSelect,
}: {
  metric: MetricKey
  selected: string | null
  vanHere: string | null
  onSelect: (name: string | null) => void
}) {
  const theme = useUi((s) => s.theme) as Theme
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [frame, setFrame] = useState<Frame>('us')
  const m = METRICS[metric]
  const fills = BUCKET_FILL[theme]
  const brand = BRAND[theme]

  /** Other states as muted context; Louisiana omitted so parish fills show through. */
  const statesData = useMemo(() => {
    const src = usStates as GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      { name: string; state?: string }
    >
    return {
      type: 'FeatureCollection' as const,
      features: src.features
        .filter((f) => f.properties.name !== 'Louisiana')
        .map((f) => ({
          ...f,
          properties: {
            name: f.properties.name,
            isLouisiana: 0,
          },
        })),
    }
  }, [])

  const data = useMemo(() => {
    const byName = new Map(PARISH_DATA.map((p) => [p.n, p]))
    const hasSelection = selected != null
    return {
      type: 'FeatureCollection' as const,
      features: (
        laParishes as GeoJSON.FeatureCollection<
          GeoJSON.Geometry,
          { parishname: string; parishcode: string }
        >
      ).features.map((f) => {
        const name = f.properties.parishname
        const row = byName.get(name)
        const bucket = row ? bucketOf(row, metric) : 0
        const isSelected = selected === name
        return {
          ...f,
          properties: {
            ...f.properties,
            parishname: name,
            name,
            bucket,
            selected: isSelected ? 1 : 0,
            active: hasSelection ? (isSelected ? 1 : 0) : 1,
          },
        }
      }),
    }
  }, [metric, selected])

  const fillPaint = useMemo(
    () => ({
      'fill-color': [
        'match',
        ['get', 'bucket'],
        0,
        fills[0],
        1,
        fills[1],
        2,
        fills[2],
        3,
        fills[3],
        4,
        fills[4],
        5,
        fills[5],
        fills[0],
      ] as never,
      'fill-opacity': [
        'case',
        ['==', ['get', 'selected'], 1],
        0.2,
        ['==', ['get', 'active'], 0],
        0.48,
        0.92,
      ] as never,
    }),
    [fills],
  )

  const linePaint = useMemo(
    () => ({
      'line-color': [
        'case',
        ['==', ['get', 'selected'], 1],
        brand,
        STROKE[theme],
      ] as never,
      'line-width': ['case', ['==', ['get', 'selected'], 1], 2.4, 0.65] as never,
    }),
    [theme, brand],
  )

  const pinCentroid = selected ? PARISH_CENTROIDS[selected] : null
  const hoverCare = hover ? PARISH_CARE[hover.name] : null

  const clear = useCallback(() => onSelect(null), [onSelect])

  const showUnitedStates = useCallback(() => {
    onSelect(null)
    setFrame('us')
  }, [onSelect])

  const showLouisiana = useCallback(() => {
    onSelect(null)
    setFrame('la')
  }, [onSelect])

  return (
    <div className="relative h-[min(64vh,560px)] w-full overflow-hidden rounded-xl border border-border bg-muted/20 [perspective:1200px]">
      <MapCN
        blank
        theme={theme}
        center={US_CENTER}
        zoom={US_ZOOM}
        pitch={US_PITCH}
        minZoom={3}
        maxZoom={10}
        maxPitch={55}
        scrollZoom
        dragRotate={false}
        pitchWithRotate={false}
        className="h-full w-full"
      >
        <CameraFocus selected={selected} frame={frame} />
        <SelectedExtrusion selected={selected} theme={theme} />
        <SelectionChrome selected={selected} onClear={clear} />

        {/* Continental context — under Louisiana parishes */}
        <MapGeoJSON<StateProps>
          data={statesData}
          promoteId="name"
          interactive
          fillPaint={{
            'fill-color': STATE_FILL[theme],
            'fill-opacity': 0.88,
          }}
          linePaint={{
            'line-color': STATE_LINE[theme],
            'line-width': 0.6,
          }}
          fillHoverPaint={{ 'fill-opacity': 1 }}
          onClick={(e) => {
            const name = e.feature.properties.name
            toast(`BayouCare parish detail is Louisiana-only — ${name} has no parish layer here.`)
          }}
        />

        {/* State abbreviations (CA, FL, …) — HTML markers so blank basemap needs no glyphs */}
        {(usStateLabels as GeoJSON.FeatureCollection<GeoJSON.Point, { name: string; abbr: string }>).features.map(
          (f) => {
            const [lng, lat] = f.geometry.coordinates
            const isLA = f.properties.abbr === 'LA'
            return (
              <MapMarker key={f.properties.abbr} longitude={lng} latitude={lat}>
                <MarkerContent className="pointer-events-none !bg-transparent !shadow-none">
                  <span
                    className={cn(
                      'select-none text-[11px] font-bold tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]',
                      isLA
                        ? 'text-brand-600 dark:text-brand-500'
                        : 'text-foreground/85',
                      // Fade labels once parish detail is the focus.
                      (frame === 'la' || selected) && !isLA && 'opacity-40',
                      selected && isLA && 'opacity-0',
                    )}
                    title={f.properties.name}
                  >
                    {f.properties.abbr}
                  </span>
                </MarkerContent>
              </MapMarker>
            )
          },
        )}

        <MapGeoJSON<ParishProps>
          data={data}
          promoteId="parishname"
          interactive
          fillPaint={fillPaint}
          linePaint={linePaint}
          fillHoverPaint={{ 'fill-opacity': 1 }}
          onHover={(e) => {
            if (!e) {
              setHover(null)
              return
            }
            const name = e.feature.properties.parishname
            if (selected === name) {
              setHover(null)
              return
            }
            const row = PARISH_DATA.find((p) => p.n === name)
            if (!row) {
              setHover(null)
              return
            }
            setHover({ name, lng: e.longitude, lat: e.latitude, row })
          }}
          onClick={(e) => {
            const name = e.feature.properties.parishname
            setFrame('la')
            onSelect(selected === name ? null : name)
          }}
        />

        {cancerFacilities.map((f) => {
          const Icon = facilityIcon(f.kind)
          const inSelected =
            selected != null &&
            PARISH_CARE[selected]?.clinicsInParish.some((c) => c.id === f.id)
          return (
            <MapMarker key={f.id} longitude={f.lng} latitude={f.lat}>
              <MarkerContent className="cursor-pointer">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full shadow-[var(--shadow-sm)] ring-2 transition-opacity duration-200',
                    facilityTone(f.kind),
                    selected && !inSelected && 'opacity-35',
                    inSelected && 'scale-110 ring-brand-400',
                  )}
                >
                  <Icon className="size-3" aria-hidden="true" />
                </span>
              </MarkerContent>
              <MarkerTooltip>
                <span className="text-xs font-semibold">{f.name}</span>
              </MarkerTooltip>
              <MarkerPopup className="min-w-[200px] max-w-[240px] rounded-xl border border-border bg-card p-3 text-card-foreground shadow-[var(--shadow)]">
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{f.kind}</p>
                <p className="mt-2 text-xs text-muted-foreground">{f.services.join(' · ')}</p>
              </MarkerPopup>
              {f.kind === 'ochsner' ? (
                <MarkerLabel className="text-[10px] font-bold text-brand-600 dark:text-brand-500">
                  Ochsner
                </MarkerLabel>
              ) : null}
            </MapMarker>
          )
        })}

        {vanHere && PARISH_CENTROIDS[vanHere] ? (
          <MapMarker
            longitude={PARISH_CENTROIDS[vanHere][0]}
            latitude={PARISH_CENTROIDS[vanHere][1]}
          >
            <MarkerContent>
              <span className="flex size-3 rounded-full bg-brand-500 ring-4 ring-brand-500/30" />
            </MarkerContent>
            <MarkerTooltip>Van → {vanHere}</MarkerTooltip>
          </MapMarker>
        ) : null}

        <AnimatePresence>
          {selected && pinCentroid ? (
            <MapMarker
              key={selected}
              longitude={pinCentroid[0]}
              latitude={pinCentroid[1]}
              offset={[0, -8]}
            >
              <MarkerContent className="!bg-transparent !shadow-none">
                <Map3DPin title={`${selected} Parish`} />
              </MarkerContent>
            </MapMarker>
          ) : null}
        </AnimatePresence>

        {hover && hoverCare ? (
          <MapPopup
            longitude={hover.lng}
            latitude={hover.lat}
            offset={16}
            closeOnClick={false}
            className="pointer-events-none w-[228px] rounded-xl border border-border bg-card/95 p-3 text-card-foreground shadow-[var(--shadow)] backdrop-blur-sm"
          >
            <p className="text-sm font-semibold">{hover.name} Parish</p>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
              {(
                [
                  ['Population', hover.row.pop.toLocaleString()],
                  ['Screening coverage', `${hover.row.cov}%`],
                  [
                    'Unmet need',
                    hover.row.need == null ? '—' : hover.row.need.toFixed(1),
                  ],
                  ['Care sites in parish', String(hoverCare.clinicCount)],
                  [
                    'Nearest care',
                    hoverCare.nearest ? `${hoverCare.nearest.miles} mi` : '—',
                  ],
                  [
                    m.label,
                    m.f(hover.row) == null ? '—' : m.fmt(m.f(hover.row)!),
                  ],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-bold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            {hoverCare.nearest ? (
              <p className="mt-2 truncate text-[10px] text-muted-foreground">
                {hoverCare.nearest.facility.name}
              </p>
            ) : null}
            <p className="mt-1.5 text-[10px] text-muted-foreground">Click to focus</p>
          </MapPopup>
        ) : null}

        <MapControls position="bottom-right" showZoom showCompass={false} />
      </MapCN>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-card/90 px-2.5 py-2 text-[10px] text-muted-foreground backdrop-blur-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <span className="size-2 rounded-full bg-brand-600" /> Ochsner
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-500" /> Cancer center
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground" /> Hospital partner
        </span>
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
        {selected ? (
          <div className="rounded-lg border border-brand-500/35 bg-card/95 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-sm)] backdrop-blur-sm">
            Focused: {selected}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card/90 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm">
            {frame === 'us'
              ? 'United States · zoom into Louisiana for parish detail'
              : 'Louisiana parishes · hover for numbers · click to lift & pin'}
          </div>
        )}
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
          <Button
            type="button"
            size="xs"
            variant={frame === 'us' && !selected ? 'default' : 'outline'}
            className="font-bold shadow-[var(--shadow-sm)]"
            onClick={showUnitedStates}
          >
            United States
          </Button>
          <Button
            type="button"
            size="xs"
            variant={frame === 'la' && !selected ? 'default' : 'outline'}
            className="font-bold shadow-[var(--shadow-sm)]"
            onClick={showLouisiana}
          >
            Louisiana
          </Button>
          {selected ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="font-bold shadow-[var(--shadow-sm)]"
              onClick={clear}
            >
              Clear parish
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
