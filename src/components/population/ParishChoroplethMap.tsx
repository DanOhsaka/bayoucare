import type { GeoJSONSource, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Cross, Hospital } from 'lucide-react'
import { toast } from 'sonner'

import { Map3DPin } from '@/components/ui/3d-pin'
import {
  Map as MapCN,
  MapControls,
  MapMarker,
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
import { PARISH_CARE, PARISH_CENTROIDS, parishFeatureByName } from '@/lib/parishGeo'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'
type Frame = 'us' | 'la'

const US_CENTER: [number, number] = [-97.5, 38.5]
const US_ZOOM = 3.55
const US_PITCH = 8

const LA_CENTER: [number, number] = [-91.85, 31.05]
const LA_ZOOM = 6.2
const FOCUS_ZOOM = 8.4
const FOCUS_PITCH = 48
const DEFAULT_PITCH = 16

/** Choropleth ramp — matches the unmet-need legend (muted → green → amber → coral). */
const BUCKET_FILL: Record<Theme, string[]> = {
  light: ['#d4d4d0', '#e8f8ef', '#b8ebd0', '#f5d98a', '#e8a317', '#e05a3c'],
  dark: ['#3f3f3c', '#14533a', '#1f7a54', '#9a7a1c', '#e8a317', '#f07158'],
}

const BRAND: Record<Theme, string> = {
  light: '#149567',
  dark: '#34d399',
}

const PARISH_SRC = 'bc-parishes-src'
const PARISH_FILL = 'bc-parishes-fill'
const PARISH_LINE = 'bc-parishes-line'
const PARISH_EXTRUDE_SRC = 'bc-parish-extrude-src'
const PARISH_EXTRUDE = 'bc-parish-extrude'
const STATE_SRC = 'bc-states-src'
const STATE_FILL = 'bc-states-fill'
const STATE_LINE = 'bc-states-line'

type HoverInfo = {
  name: string
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

function buildParishCollection(metric: MetricKey, selected: string | null, hovered: string | null) {
  const byName = new Map(PARISH_DATA.map((p) => [p.n, p]))
  const src = laParishes as GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    { parishname: string; parishcode: string }
  >

  return {
    type: 'FeatureCollection' as const,
    features: src.features.map((f) => {
      const name = f.properties.parishname
      const row = byName.get(name)
      const bucket = row ? bucketOf(row, metric) : 0
      return {
        type: 'Feature' as const,
        id: name,
        properties: {
          parishname: name,
          parishcode: f.properties.parishcode,
          bucket,
          selected: selected === name ? 1 : 0,
          hovered: hovered === name ? 1 : 0,
        },
        geometry: f.geometry,
      }
    }),
  }
}

function buildStatesCollection() {
  const src = usStates as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>
  return {
    type: 'FeatureCollection' as const,
    features: src.features
      .filter((f) => f.properties.name !== 'Louisiana')
      .map((f) => ({
        type: 'Feature' as const,
        id: f.properties.name,
        properties: { name: f.properties.name },
        geometry: f.geometry,
      })),
  }
}

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

/**
 * Brand-green fill-extrusion that lifts the selected parish into a 3D slab.
 * Pitch from CameraFocus makes the elevation read clearly.
 */
function SelectedParishExtrusion({
  selected,
  theme,
}: {
  selected: string | null
  theme: Theme
}) {
  const { map, isLoaded } = useMap()
  const brand = BRAND[theme]

  useEffect(() => {
    if (!map || !isLoaded) return

    const feat = selected ? parishFeatureByName(selected) : null
    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: feat
        ? [
            {
              type: 'Feature',
              properties: { parishname: selected },
              geometry: feat.geometry,
            },
          ]
        : [],
    }

    const ensure = () => {
      try {
        if (!map.getSource(PARISH_EXTRUDE_SRC)) {
          map.addSource(PARISH_EXTRUDE_SRC, { type: 'geojson', data })
        } else {
          ;(map.getSource(PARISH_EXTRUDE_SRC) as GeoJSONSource).setData(data)
        }

        if (!map.getLayer(PARISH_EXTRUDE)) {
          map.addLayer({
            id: PARISH_EXTRUDE,
            type: 'fill-extrusion',
            source: PARISH_EXTRUDE_SRC,
            paint: {
              'fill-extrusion-color': brand,
              'fill-extrusion-opacity': selected ? 0.72 : 0,
              'fill-extrusion-height': selected ? 22000 : 0,
              'fill-extrusion-base': 0,
              'fill-extrusion-vertical-gradient': true,
            },
          })
        } else {
          map.setPaintProperty(PARISH_EXTRUDE, 'fill-extrusion-color', brand)
          map.setPaintProperty(PARISH_EXTRUDE, 'fill-extrusion-height', selected ? 22000 : 0)
          map.setPaintProperty(PARISH_EXTRUDE, 'fill-extrusion-opacity', selected ? 0.72 : 0)
        }
      } catch {
        /* style mid-reload */
      }
    }

    ensure()
    map.on('style.load', ensure)
    return () => {
      map.off('style.load', ensure)
      try {
        if (map.getLayer(PARISH_EXTRUDE)) map.removeLayer(PARISH_EXTRUDE)
        if (map.getSource(PARISH_EXTRUDE_SRC)) map.removeSource(PARISH_EXTRUDE_SRC)
      } catch {
        /* torn down */
      }
    }
  }, [map, isLoaded, selected, brand])

  return null
}

/**
 * Direct MapLibre parish choropleth — does not depend on MapGeoJSON timing/beforeId.
 * Survives style reloads by re-attaching on `style.load`.
 */
function LouisianaParishLayer({
  metric,
  selected,
  theme,
  indexOn,
  onHover,
  onSelect,
}: {
  metric: MetricKey
  selected: string | null
  theme: Theme
  /** When true, parish fills use the metric color ramp; when false, street map shows through. */
  indexOn: boolean
  onHover: (info: HoverInfo | null) => void
  onSelect: (name: string) => void
}) {
  const { map, isLoaded } = useMap()
  const [hovered, setHovered] = useState<string | null>(null)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  onHoverRef.current = onHover
  onSelectRef.current = onSelect

  const collection = useMemo(
    () => buildParishCollection(metric, selected, hovered),
    [metric, selected, hovered],
  )

  const fills = BUCKET_FILL[theme]
  const brand = BRAND[theme]

  // Create / recreate layers whenever the basemap style is ready.
  useEffect(() => {
    if (!map || !isLoaded) return

    const ensure = () => {
      try {
        if (!map.getSource(STATE_SRC)) {
          map.addSource(STATE_SRC, {
            type: 'geojson',
            data: buildStatesCollection(),
            promoteId: 'name',
          })
        }
        if (!map.getLayer(STATE_FILL)) {
          map.addLayer({
            id: STATE_FILL,
            type: 'fill',
            source: STATE_SRC,
            paint: {
              'fill-color': theme === 'dark' ? '#252b28' : '#dfe6e2',
              'fill-opacity': indexOn ? 0.4 : 0.08,
            },
          })
        } else {
          map.setPaintProperty(STATE_FILL, 'fill-opacity', indexOn ? 0.4 : 0.08)
        }
        if (!map.getLayer(STATE_LINE)) {
          map.addLayer({
            id: STATE_LINE,
            type: 'line',
            source: STATE_SRC,
            paint: {
              'line-color': theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,20,18,0.25)',
              'line-width': 0.6,
            },
          })
        }

        if (!map.getSource(PARISH_SRC)) {
          map.addSource(PARISH_SRC, {
            type: 'geojson',
            data: collection,
            promoteId: 'parishname',
          })
        } else {
          ;(map.getSource(PARISH_SRC) as GeoJSONSource).setData(collection)
        }

        if (!map.getLayer(PARISH_FILL)) {
          map.addLayer({
            id: PARISH_FILL,
            type: 'fill',
            source: PARISH_SRC,
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'hovered'], 1],
                brand,
                [
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
                ],
              ],
              'fill-opacity': [
                'case',
                ['==', ['get', 'hovered'], 1],
                indexOn ? 0.85 : 0.14,
                ['==', ['get', 'selected'], 1],
                indexOn ? 0.35 : 0.1,
                indexOn ? 0.78 : 0.04,
              ],
            },
          })
        } else {
          map.setPaintProperty(PARISH_FILL, 'fill-opacity', [
            'case',
            ['==', ['get', 'hovered'], 1],
            indexOn ? 0.85 : 0.14,
            ['==', ['get', 'selected'], 1],
            indexOn ? 0.35 : 0.1,
            indexOn ? 0.78 : 0.04,
          ])
        }

        if (!map.getLayer(PARISH_LINE)) {
          map.addLayer({
            id: PARISH_LINE,
            type: 'line',
            source: PARISH_SRC,
            paint: {
              'line-color': [
                'case',
                ['==', ['get', 'selected'], 1],
                brand,
                ['==', ['get', 'hovered'], 1],
                brand,
                theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(15,20,18,0.4)',
              ],
              'line-width': [
                'case',
                ['==', ['get', 'selected'], 1],
                2.6,
                ['==', ['get', 'hovered'], 1],
                2,
                0.9,
              ],
            },
          })
        }
      } catch {
        /* style mid-reload */
      }
    }

    ensure()
    map.on('style.load', ensure)
    return () => {
      map.off('style.load', ensure)
      try {
        if (map.getLayer(PARISH_LINE)) map.removeLayer(PARISH_LINE)
        if (map.getLayer(PARISH_FILL)) map.removeLayer(PARISH_FILL)
        if (map.getSource(PARISH_SRC)) map.removeSource(PARISH_SRC)
        if (map.getLayer(STATE_LINE)) map.removeLayer(STATE_LINE)
        if (map.getLayer(STATE_FILL)) map.removeLayer(STATE_FILL)
        if (map.getSource(STATE_SRC)) map.removeSource(STATE_SRC)
      } catch {
        /* torn down */
      }
    }
    // collection intentionally omitted — data synced in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, theme, brand, fills, indexOn])

  // Keep parish GeoJSON (colors / hover / selected) in sync.
  useEffect(() => {
    if (!map || !isLoaded) return
    const src = map.getSource(PARISH_SRC) as GeoJSONSource | undefined
    src?.setData(collection)
  }, [map, isLoaded, collection])

  // Refresh paint when theme/fills change and layers already exist.
  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(PARISH_FILL)) return
    try {
      map.setPaintProperty(PARISH_FILL, 'fill-color', [
        'case',
        ['==', ['get', 'hovered'], 1],
        brand,
        [
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
        ],
      ])
      map.setPaintProperty(PARISH_LINE, 'line-color', [
        'case',
        ['==', ['get', 'selected'], 1],
        brand,
        ['==', ['get', 'hovered'], 1],
        brand,
        theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(15,20,18,0.4)',
      ])
    } catch {
      /* ignore */
    }
  }, [map, isLoaded, brand, fills, theme])

  // Hover + click
  useEffect(() => {
    if (!map || !isLoaded) return

    const onMove = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]
      const name = f?.properties?.parishname as string | undefined
      if (!name) return
      map.getCanvas().style.cursor = 'pointer'
      setHovered(name)
      const row = PARISH_DATA.find((p) => p.n === name)
      if (row) onHoverRef.current({ name, row })
      else onHoverRef.current(null)
    }

    const onLeave = () => {
      map.getCanvas().style.cursor = ''
      setHovered(null)
      onHoverRef.current(null)
    }

    const onClick = (e: MapLayerMouseEvent) => {
      const name = e.features?.[0]?.properties?.parishname as string | undefined
      if (!name) return
      onSelectRef.current(name)
    }

    const onStateClick = (e: MapLayerMouseEvent) => {
      const name = e.features?.[0]?.properties?.name as string | undefined
      if (!name) return
      toast(`BayouCare parish detail is Louisiana-only — ${name} has no parish layer here.`)
    }

    const unbind = () => {
      try {
        map.off('mousemove', PARISH_FILL, onMove)
        map.off('mouseleave', PARISH_FILL, onLeave)
        map.off('click', PARISH_FILL, onClick)
        map.off('click', STATE_FILL, onStateClick)
      } catch {
        /* ignore */
      }
      map.getCanvas().style.cursor = ''
    }

    const bind = () => {
      unbind()
      if (!map.getLayer(PARISH_FILL)) return
      map.on('mousemove', PARISH_FILL, onMove)
      map.on('mouseleave', PARISH_FILL, onLeave)
      map.on('click', PARISH_FILL, onClick)
      if (map.getLayer(STATE_FILL)) {
        map.on('click', STATE_FILL, onStateClick)
      }
    }

    // Delay bind until layers exist from the ensure effect.
    const tryBind = () => {
      if (map.getLayer(PARISH_FILL)) bind()
    }
    tryBind()
    // Layers may appear a tick after style load / ensure().
    const t = window.setTimeout(tryBind, 0)
    map.on('style.load', tryBind)
    return () => {
      window.clearTimeout(t)
      map.off('style.load', tryBind)
      unbind()
    }
  }, [map, isLoaded])

  return null
}

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
      if (target?.closest?.('.maplibregl-marker, .maplibregl-popup, .bc-parish-pin')) return
      const hits = map.queryRenderedFeatures(e.point, { layers: [PARISH_FILL] })
      if ((!hits || hits.length === 0) && selected) onClear()
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

function MapInner({
  metric,
  selected,
  vanHere,
  theme,
  frame,
  indexOn,
  hover,
  setHover,
  onSelect,
  setFrame,
  onClear,
}: {
  metric: MetricKey
  selected: string | null
  vanHere: string | null
  theme: Theme
  frame: Frame
  indexOn: boolean
  hover: HoverInfo | null
  setHover: (h: HoverInfo | null) => void
  onSelect: (name: string | null) => void
  setFrame: (f: Frame) => void
  onClear: () => void
}) {
  const pinCentroid = selected ? PARISH_CENTROIDS[selected] : null

  return (
    <>
      <CameraFocus selected={selected} frame={frame} />
      <LouisianaParishLayer
        metric={metric}
        selected={selected}
        theme={theme}
        indexOn={indexOn}
        onHover={setHover}
        onSelect={(name) => {
          setFrame('la')
          onSelect(selected === name ? null : name)
        }}
      />
      <SelectedParishExtrusion selected={selected} theme={theme} />
      <SelectionChrome selected={selected} onClear={onClear} />

      {!hover && frame === 'us'
        ? (
            usStateLabels as GeoJSON.FeatureCollection<
              GeoJSON.Point,
              { name: string; abbr: string }
            >
          ).features.map((f) => {
            const [lng, lat] = f.geometry.coordinates
            return (
              <MapMarker key={f.properties.abbr} longitude={lng} latitude={lat}>
                <MarkerContent className="pointer-events-none !bg-transparent !shadow-none">
                  <span
                    className={cn(
                      'select-none text-[10px] font-bold tracking-wide text-foreground/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]',
                      f.properties.abbr === 'LA' && 'text-brand-500',
                    )}
                    title={f.properties.name}
                  >
                    {f.properties.abbr}
                  </span>
                </MarkerContent>
              </MapMarker>
            )
          })
        : null}

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
                  selected && !inSelected && 'opacity-40',
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

      {selected && pinCentroid ? (
        <MapMarker
          key={`pin-${selected}`}
          longitude={pinCentroid[0]}
          latitude={pinCentroid[1]}
          anchor="bottom"
          pitchAlignment="viewport"
          rotationAlignment="viewport"
        >
          <MarkerContent className="!bg-transparent !shadow-none !cursor-default">
            <Map3DPin title={`${selected} Parish`} />
          </MarkerContent>
        </MapMarker>
      ) : null}

      <MapControls position="bottom-right" showZoom showCompass={false} />
    </>
  )
}

/**
 * US context + Louisiana parish choropleth on a street basemap.
 * Hover = highlight + info card. Click = 3D pin + side-panel selection.
 */
export function ParishChoroplethMap({
  metric,
  selected,
  vanHere,
  onSelect,
  indexOn = true,
  onIndexOnChange,
}: {
  metric: MetricKey
  selected: string | null
  vanHere: string | null
  onSelect: (name: string | null) => void
  /** Choropleth heat colors on parish fills. Off = normal street map with outlines. */
  indexOn?: boolean
  onIndexOnChange?: (on: boolean) => void
}) {
  const theme = useUi((s) => s.theme) as Theme
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [frame, setFrame] = useState<Frame>('la')
  const [internalIndexOn, setInternalIndexOn] = useState(true)
  const indexEnabled = onIndexOnChange ? indexOn : internalIndexOn
  const setIndexEnabled = (on: boolean) => {
    if (onIndexOnChange) onIndexOnChange(on)
    else setInternalIndexOn(on)
  }
  const selectedRow = selected ? PARISH_DATA.find((p) => p.n === selected) ?? null : null
  const selectedCare = selected ? PARISH_CARE[selected] : null

  const clear = useCallback(() => onSelect(null), [onSelect])

  return (
    <div className="relative h-[min(64vh,560px)] w-full overflow-hidden rounded-xl border border-border bg-muted/20">
      <MapCN
        theme={theme}
        center={LA_CENTER}
        zoom={LA_ZOOM}
        pitch={DEFAULT_PITCH}
        minZoom={3}
        maxZoom={14}
        maxPitch={55}
        scrollZoom
        dragRotate={false}
        pitchWithRotate={false}
        className="h-full w-full"
      >
        <MapInner
          metric={metric}
          selected={selected}
          vanHere={vanHere}
          theme={theme}
          frame={frame}
          indexOn={indexEnabled}
          hover={hover}
          setHover={setHover}
          onSelect={onSelect}
          setFrame={setFrame}
          onClear={clear}
        />
      </MapCN>

      {/* Hover label — name only; full stats on click */}
      {hover && !selected ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-border bg-card/95 px-2.5 py-1.5 text-sm font-semibold text-card-foreground shadow-[var(--shadow-sm)] backdrop-blur-sm"
        >
          {hover.name} Parish
        </div>
      ) : null}

      {/* Selected detail sheet — bottom, mobile-friendly */}
      {selected && selectedRow ? (
        <div className="absolute bottom-3 left-3 right-14 z-20 max-h-[42%] overflow-y-auto rounded-xl border border-brand-500/35 bg-card/95 p-3 text-card-foreground shadow-[var(--shadow)] backdrop-blur-sm sm:right-auto sm:w-[280px]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{selected} Parish</p>
              <p className="text-xs text-muted-foreground">
                {selectedRow.rank != null
                  ? `#${selectedRow.rank} unmet need`
                  : 'Late-stage suppressed'}
              </p>
            </div>
            <Button type="button" size="xs" variant="ghost" className="shrink-0 font-bold" onClick={clear}>
              Close
            </Button>
          </div>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
            {(
              [
                ['Population', selectedRow.pop.toLocaleString()],
                ['Incidence /100k', String(selectedRow.inc)],
                [
                  'Late-stage share',
                  selectedRow.late == null ? 'suppressed' : `${selectedRow.late}%`,
                ],
                ['Screening coverage', `${selectedRow.cov}%`],
                ['Eligible & unscreened', `≈ ${selectedRow.uns.toLocaleString()}`],
                [
                  'Need index',
                  selectedRow.need == null ? '—' : selectedRow.need.toFixed(1),
                ],
                ['Care sites in parish', String(selectedCare?.clinicCount ?? 0)],
                [
                  'Nearest care',
                  selectedCare?.nearest ? `${selectedCare.nearest.miles} mi` : '—',
                ],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-bold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          {selectedCare?.nearest ? (
            <p className="mt-2 truncate text-[10px] text-muted-foreground">
              {selectedCare.nearest.facility.name}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-card/90 px-2.5 py-2 text-[10px] text-muted-foreground backdrop-blur-sm',
          selected && 'hidden',
        )}
      >
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

      <div className="absolute right-3 top-3 z-10 flex max-w-[min(100%-1.5rem,16rem)] flex-col items-end gap-2">
        {selected ? (
          <div className="rounded-lg border border-brand-500/35 bg-card/95 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-sm)] backdrop-blur-sm">
            Focused: {selected}
          </div>
        ) : !hover ? (
          <div className="rounded-lg border border-border bg-card/90 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm">
            {indexEnabled
              ? 'Index colors on · hover for name · click for details'
              : 'Street map · turn Index on for parish heat colors'}
          </div>
        ) : null}
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
          <Button
            type="button"
            size="xs"
            variant={indexEnabled ? 'default' : 'outline'}
            aria-pressed={indexEnabled}
            className="font-bold shadow-[var(--shadow-sm)]"
            onClick={() => setIndexEnabled(!indexEnabled)}
          >
            {indexEnabled ? 'Index on' : 'Index off'}
          </Button>
          <Button
            type="button"
            size="xs"
            variant={frame === 'us' && !selected ? 'default' : 'outline'}
            className="font-bold shadow-[var(--shadow-sm)]"
            onClick={() => {
              onSelect(null)
              setFrame('us')
            }}
          >
            United States
          </Button>
          <Button
            type="button"
            size="xs"
            variant={frame === 'la' && !selected ? 'default' : 'outline'}
            className="font-bold shadow-[var(--shadow-sm)]"
            onClick={() => {
              onSelect(null)
              setFrame('la')
            }}
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
