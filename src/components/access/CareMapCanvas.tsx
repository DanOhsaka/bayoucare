import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { DemoHome } from '@/data/demoHomes'
import type { NearbyClinic } from '@/engine/access/nearby'
import type { RoadRoute } from '@/engine/access/geo'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

function cartoTileUrl(theme: 'light' | 'dark'): string {
  const key = import.meta.env.VITE_CARTO_API_KEY as string | undefined
  if (key) {
    // Voyager works with the keyed rastertiles API; dark_matter does not (404).
    // dark_all is the keyed dark basemap that actually serves PNGs.
    const style = theme === 'dark' ? 'dark_all' : 'voyager'
    return `https://basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}.png?key=${key}`
  }
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

function homeIcon() {
  return L.divIcon({
    className: 'bc-map-marker',
    html: `<div class="bc-marker bc-marker-home" title="Patient home">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  })
}

function clinicIcon(selected: boolean, kind: 'hospital' | 'clinic') {
  const cross =
    kind === 'hospital'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`

  return L.divIcon({
    className: 'bc-map-marker',
    html: `<div class="bc-marker bc-marker-clinic${selected ? ' is-selected' : ''}">${cross}</div>`,
    iconSize: selected ? [40, 40] : [32, 32],
    iconAnchor: selected ? [20, 40] : [16, 32],
    popupAnchor: [0, selected ? -38 : -30],
  })
}

function FitBounds({
  home,
  clinics,
  selectedId,
  routePositions,
}: {
  home: DemoHome
  clinics: NearbyClinic[]
  selectedId: string | null
  routePositions: Array<[number, number]> | null
}) {
  const map = useMap()

  useEffect(() => {
    const selected = clinics.find((c) => c.id === selectedId)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (routePositions && routePositions.length > 1) {
      const bounds = L.latLngBounds(routePositions)
      map.fitBounds(bounds.pad(0.2), {
        animate: !reduce,
        duration: 0.45,
        maxZoom: 15,
      })
      return
    }

    if (selected) {
      const bounds = L.latLngBounds([
        [home.lat, home.lng],
        [selected.lat, selected.lng],
      ])
      map.fitBounds(bounds.pad(0.35), {
        animate: !reduce,
        duration: 0.45,
        maxZoom: 13,
      })
      return
    }

    if (clinics.length === 0) {
      map.setView([home.lat, home.lng], 11, { animate: !reduce })
      return
    }

    const bounds = L.latLngBounds(clinics.map((c) => [c.lat, c.lng] as [number, number]))
    bounds.extend([home.lat, home.lng])
    map.fitBounds(bounds.pad(0.2), { animate: !reduce, duration: 0.4, maxZoom: 12 })
  }, [map, home, clinics, selectedId, routePositions])

  return null
}

export function CareMapCanvas({
  home,
  clinics,
  selectedId,
  onSelect,
  route,
  routePending = false,
  className,
}: {
  home: DemoHome
  clinics: NearbyClinic[]
  selectedId: string | null
  onSelect: (id: string) => void
  route: RoadRoute | null
  routePending?: boolean
  className?: string
}) {
  const theme = useUi((s) => s.theme)
  const routePositions = route?.positions ?? null

  return (
    <div className={cn('relative isolate min-h-[280px] overflow-hidden rounded-3xl', className)}>
      <MapContainer
        key={`${home.lat},${home.lng},${theme}`}
        center={[home.lat, home.lng]}
        zoom={11}
        className="h-full min-h-[280px] w-full bg-muted"
        scrollWheelZoom
        attributionControl
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/">CARTO</a>'
          url={cartoTileUrl(theme)}
        />

        <FitBounds
          home={home}
          clinics={clinics}
          selectedId={selectedId}
          routePositions={routePositions}
        />

        <Marker position={[home.lat, home.lng]} icon={homeIcon()} zIndexOffset={400}>
          <Popup>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Patient home</p>
              <p className="text-xs text-muted-foreground">{home.label}</p>
              <p className="text-xs text-muted-foreground">{home.city}, LA · demo neighborhood</p>
            </div>
          </Popup>
        </Marker>

        {clinics.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={clinicIcon(c.id === selectedId, c.kind)}
            eventHandlers={{
              click: () => onSelect(c.id),
            }}
            zIndexOffset={c.id === selectedId ? 500 : 200}
          >
            <Popup>
              <div className="max-w-[200px] space-y-1">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs">
                  {c.distanceLabel} · {c.etaLabel}
                </p>
                <p className="text-xs text-muted-foreground">{c.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {routePositions && routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#1db87f',
              weight: 5,
              opacity: routePending ? 0.4 : 0.95,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: routePending ? '8 10' : undefined,
            }}
          />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-between gap-2 p-3">
        <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground shadow-[var(--shadow-sm)] backdrop-blur-md">
          {theme === 'dark' ? 'Dark map' : 'Light map'}
        </span>
        <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-[var(--shadow-sm)] backdrop-blur-md">
          CARTO · OSRM
        </span>
      </div>
    </div>
  )
}
