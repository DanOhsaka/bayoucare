import { useEffect, useMemo } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { Layer, PathOptions } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import laParishes from '@/data/la-parishes.json'
import cancerFacilities from '@/data/cancerFacilities.json'
import { PARISH_DATA, bucketOf, type MetricKey } from '@/engine/population/parishes'
import { PARISH_CARE, PARISH_CENTROIDS } from '@/lib/parishGeo'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'
type Frame = 'us' | 'la'

const LA_BOUNDS = L.latLngBounds([28.85, -94.15], [33.15, -88.75])
const US_BOUNDS = L.latLngBounds([24.5, -125], [49.5, -66.5])

const BUCKET_FILL: Record<Theme, string[]> = {
  light: ['#d4d4d0', '#e8f8ef', '#b8ebd0', '#f5d98a', '#e8a317', '#e05a3c'],
  dark: ['#3f3f3c', '#14533a', '#1f7a54', '#9a7a1c', '#e8a317', '#f07158'],
}

function cartoTileUrl(theme: Theme): string {
  const key = import.meta.env.VITE_CARTO_API_KEY as string | undefined
  if (key) {
    const style = theme === 'dark' ? 'dark_all' : 'voyager'
    return `https://basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}.png?key=${key}`
  }
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

function facilityColor(kind: string) {
  if (kind === 'ochsner') return '#149567'
  if (kind === 'cancer') return '#e8a317'
  return '#737373'
}

function Camera({ selected, frame }: { selected: string | null; frame: Frame }) {
  const map = useMap()

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (selected && PARISH_CENTROIDS[selected]) {
      const [lng, lat] = PARISH_CENTROIDS[selected]
      map.flyTo([lat, lng], 9, { animate: !reduce, duration: 0.55 })
      return
    }
    map.fitBounds(frame === 'us' ? US_BOUNDS : LA_BOUNDS, {
      animate: !reduce,
      duration: 0.45,
      padding: [24, 24],
    })
  }, [map, selected, frame])

  return null
}

/** Used only when WebGL2 is missing (e.g. Cursor Simple Browser). */
export function ParishLeafletChoropleth({
  metric,
  selected,
  vanHere,
  indexOn,
  frame,
  onSelect,
  onHover,
  className,
}: {
  metric: MetricKey
  selected: string | null
  vanHere: string | null
  indexOn: boolean
  frame: Frame
  onSelect: (name: string | null) => void
  onHover: (name: string | null) => void
  className?: string
}) {
  const theme = useUi((s) => s.theme) as Theme

  const collection = useMemo(() => {
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
          ...f,
          properties: {
            ...f.properties,
            bucket,
            selected: selected === name,
          },
        }
      }),
    }
  }, [metric, selected])

  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    const bucket = Number(feature?.properties?.bucket ?? 0)
    const isSelected = Boolean(feature?.properties?.selected)
    const fill = BUCKET_FILL[theme][bucket] ?? BUCKET_FILL[theme][0]
    return {
      fillColor: indexOn ? fill : 'transparent',
      fillOpacity: indexOn ? (isSelected ? 0.92 : 0.72) : 0,
      color: isSelected ? '#34d399' : theme === 'dark' ? '#525252' : '#a3a3a3',
      weight: isSelected ? 2.5 : 1,
      opacity: 1,
    }
  }

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const name = String(feature.properties?.parishname ?? '')
    layer.on({
      mouseover: () => onHover(name),
      mouseout: () => onHover(null),
      click: () => onSelect(selected === name ? null : name),
    })
  }

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MapContainer
        center={[31.05, -91.85]}
        zoom={6}
        minZoom={3}
        maxZoom={14}
        scrollWheelZoom
        className="h-full w-full [&_.leaflet-control-attribution]:text-[9px]"
        preferCanvas
        zoomControl={false}
      >
        <TileLayer
          key={theme}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={cartoTileUrl(theme)}
        />
        <GeoJSON
          key={`${metric}-${indexOn}-${theme}-${selected ?? 'none'}`}
          data={collection as GeoJSON.GeoJsonObject}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
        {cancerFacilities.map((f) => {
          const inSelected =
            selected != null &&
            (PARISH_CARE[selected]?.clinicsInParish.some((c) => c.id === f.id) ?? false)
          return (
            <CircleMarker
              key={f.id}
              center={[f.lat, f.lng]}
              radius={inSelected ? 8 : 6}
              pathOptions={{
                color: '#fff',
                weight: 1.5,
                fillColor: facilityColor(f.kind),
                fillOpacity: selected && !inSelected ? 0.4 : 0.95,
              }}
            >
              <Popup>
                <div className="min-w-[140px] text-xs">
                  <p className="font-semibold text-foreground">{f.name}</p>
                  <p className="mt-0.5 capitalize text-muted-foreground">{f.kind}</p>
                  <p className="mt-1 text-muted-foreground">{f.services.join(' · ')}</p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
        {vanHere && PARISH_CENTROIDS[vanHere] ? (
          <CircleMarker
            center={[PARISH_CENTROIDS[vanHere][1], PARISH_CENTROIDS[vanHere][0]]}
            radius={7}
            pathOptions={{ color: '#149567', weight: 3, fillColor: '#34d399', fillOpacity: 1 }}
          >
            <Popup>Van → {vanHere}</Popup>
          </CircleMarker>
        ) : null}
        <Camera selected={selected} frame={frame} />
      </MapContainer>
    </div>
  )
}

export function canUseWebGL2(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
