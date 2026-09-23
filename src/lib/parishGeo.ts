import laParishes from '@/data/la-parishes.json'
import cancerFacilities from '@/data/cancerFacilities.json'

type Ring = number[][]
type Facility = (typeof cancerFacilities)[number]

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!
    const yi = ring[i]![1]!
    const xj = ring[j]![0]!
    const yj = ring[j]![1]!
    const denom = yj - yi
    if (denom === 0) continue
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / denom + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInGeometry(lng: number, lat: number, geometry: GeoJSON.Geometry): boolean {
  if (geometry.type === 'Polygon') {
    const [outer, ...holes] = geometry.coordinates
    if (!outer || !pointInRing(lng, lat, outer)) return false
    return !holes.some((h) => pointInRing(lng, lat, h))
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => {
      const [outer, ...holes] = poly
      if (!outer || !pointInRing(lng, lat, outer)) return false
      return !holes.some((h) => pointInRing(lng, lat, h))
    })
  }
  return false
}

/** Approximate geographic centroid from the outer ring (mean of vertices). */
function ringCentroid(ring: Ring): [number, number] {
  let sx = 0
  let sy = 0
  const n = Math.max(1, ring.length - (ring[0] === ring[ring.length - 1] ? 1 : 0))
  for (let i = 0; i < n; i++) {
    sx += ring[i]![0]!
    sy += ring[i]![1]!
  }
  return [sx / n, sy / n]
}

function geometryCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  if (geometry.type === 'Polygon') {
    const outer = geometry.coordinates[0]
    return outer ? ringCentroid(outer) : null
  }
  if (geometry.type === 'MultiPolygon') {
    // Prefer the largest ring (by vertex count) as the visual anchor.
    let best: Ring | null = null
    for (const poly of geometry.coordinates) {
      const outer = poly[0]
      if (!outer) continue
      if (!best || outer.length > best.length) best = outer
    }
    return best ? ringCentroid(best) : null
  }
  return null
}

const fc = laParishes as GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  { parishname: string; parishcode: string }
>

/** Stable centroid per parish name (lng, lat). */
export const PARISH_CENTROIDS: Record<string, [number, number]> = Object.fromEntries(
  fc.features.flatMap((f) => {
    const c = geometryCentroid(f.geometry)
    return c ? [[f.properties.parishname, c] as const] : []
  }),
)

function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

export type ParishCareContext = {
  clinicsInParish: Facility[]
  clinicCount: number
  nearest: { facility: Facility; miles: number } | null
}

/** Facilities inside each parish + nearest statewide site to the parish centroid. */
export const PARISH_CARE: Record<string, ParishCareContext> = Object.fromEntries(
  fc.features.map((f) => {
    const name = f.properties.parishname
    const centroid = PARISH_CENTROIDS[name]
    const clinicsInParish = cancerFacilities.filter((site) =>
      pointInGeometry(site.lng, site.lat, f.geometry),
    )
    let nearest: ParishCareContext['nearest'] = null
    if (centroid) {
      let best: Facility | null = null
      let bestD = Infinity
      for (const site of cancerFacilities) {
        const d = haversineMi(centroid[1], centroid[0], site.lat, site.lng)
        if (d < bestD) {
          bestD = d
          best = site
        }
      }
      if (best) nearest = { facility: best, miles: Math.round(bestD * 10) / 10 }
    }
    return [
      name,
      {
        clinicsInParish,
        clinicCount: clinicsInParish.length,
        nearest,
      } satisfies ParishCareContext,
    ]
  }),
)

export function parishFeatureByName(name: string) {
  return fc.features.find((f) => f.properties.parishname === name) ?? null
}
