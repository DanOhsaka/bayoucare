/**
 * Access-map geometry helpers.
 *
 * Road geometry comes from OSRM (OpenStreetMap routing). Haversine estimates
 * remain for the clinic list until per-clinic live routes are worth the cost.
 *
 * Do not console.log coordinates from this module.
 */

import type { TravelMode } from '@/data/demoHomes'

const EARTH_MI = 3958.8
const METERS_PER_MILE = 1609.344

export type LatLng = { lat: number; lng: number }

export type RoadRoute = {
  /** Leaflet positions [lat, lng]. */
  positions: Array<[number, number]>
  distanceMiles: number
  durationMinutes: number
  source: 'osrm' | 'fallback'
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_MI * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Friendly distance — one decimal under 10 mi, whole miles above. */
export function formatMiles(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return '—'
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

export function formatMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins < 0) return '—'
  if (mins < 1) return '<1 min'
  return `${Math.round(mins)} min`
}

/**
 * Rough ETAs for rural Louisiana when live routing is unavailable.
 * Drive ~28 mph average. Walk ~3 mph.
 */
export function estimateTravel(
  miles: number,
  mode: TravelMode,
): { minutes: number; miles: number } {
  const speedMph = mode === 'walk' ? 3 : 28
  const minutes = (miles / speedMph) * 60
  return { miles, minutes }
}

/** Curved fallback if the routing service is unreachable. */
export function buildFallbackPolyline(
  from: LatLng,
  to: LatLng,
  segments = 24,
): Array<[number, number]> {
  const midLat = (from.lat + to.lat) / 2
  const midLng = (from.lng + to.lng) / 2
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const len = Math.hypot(dx, dy) || 1
  const bulge = 0.12 * len
  const ctrlLat = midLat + (-dx / len) * bulge
  const ctrlLng = midLng + (dy / len) * bulge

  const pts: Array<[number, number]> = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    const lat = u * u * from.lat + 2 * u * t * ctrlLat + t * t * to.lat
    const lng = u * u * from.lng + 2 * u * t * ctrlLng + t * t * to.lng
    pts.push([lat, lng])
  }
  return pts
}

/** @deprecated Prefer buildFallbackPolyline or fetchRoadRoute. */
export const buildRoutePolyline = buildFallbackPolyline

function osrmProfile(mode: TravelMode): 'driving' | 'walking' {
  return mode === 'walk' ? 'walking' : 'driving'
}

/**
 * Fetch a street-following route via the public OSRM demo server.
 * Coordinates are only sent to the routing API — never logged here.
 *
 * NOTE: router.project-osrm.org often returns identical car durations for
 * `driving` / `walking` / `foot`. Geometry and distance still come from OSRM;
 * walk ETAs are derived from road distance at walking speed so Drive↔Walk
 * actually changes the time the user sees.
 */
export async function fetchRoadRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
  signal?: AbortSignal,
): Promise<RoadRoute> {
  const profile = osrmProfile(mode)
  // OSRM expects lng,lat — not lat,lng.
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/${path}` +
    `?overview=full&geometries=geojson&steps=false`

  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('route-http')
    const data = (await res.json()) as {
      code?: string
      routes?: Array<{
        distance: number
        duration: number
        geometry?: { coordinates?: Array<[number, number]> }
      }>
    }
    const route = data.routes?.[0]
    const coords = route?.geometry?.coordinates
    if (data.code !== 'Ok' || !route || !coords?.length) throw new Error('route-empty')

    const positions: Array<[number, number]> = coords.map(([lng, lat]) => [lat, lng])
    const distanceMiles = route.distance / METERS_PER_MILE
    const osrmMinutes = route.duration / 60
    // Prefer OSRM's car duration for driving; always derive walking from distance.
    const durationMinutes =
      mode === 'walk' ? estimateTravel(distanceMiles, 'walk').minutes : osrmMinutes

    return {
      positions,
      distanceMiles,
      durationMinutes,
      source: 'osrm',
    }
  } catch (err) {
    if (signal?.aborted) throw err
    const miles = haversineMiles(from, to)
    const { minutes } = estimateTravel(miles, mode)
    return {
      positions: buildFallbackPolyline(from, to),
      distanceMiles: miles,
      durationMinutes: minutes,
      source: 'fallback',
    }
  }
}

/** External directions to a clinic only — never put home coordinates in the URL. */
export function externalDirectionsUrl(dest: {
  lat: number
  lng: number
  name: string
}): string {
  const q = encodeURIComponent(`${dest.lat},${dest.lng}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`
}
