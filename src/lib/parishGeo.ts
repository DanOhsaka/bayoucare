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

/** Area-weighted polygon centroid (more stable than vertex mean on coasts). */
function ringAreaCentroid(ring: Ring): [number, number] {
  let twiceArea = 0
  let cx = 0
  let cy = 0
  const n = ring.length
  const closed =
    n > 1 && ring[0]![0] === ring[n - 1]![0] && ring[0]![1] === ring[n - 1]![1]
  const last = closed ? n - 1 : n

  for (let i = 0; i < last; i++) {
    const [x1, y1] = ring[i]!
    const [x2, y2] = ring[(i + 1) % (closed ? n - 1 : n)] ?? ring[0]!
    const cross = x1 * y2 - x2 * y1
    twiceArea += cross
    cx += (x1 + x2) * cross
    cy += (y1 + y2) * cross
  }

  if (Math.abs(twiceArea) < 1e-12) {
    let sx = 0
    let sy = 0
    for (let i = 0; i < last; i++) {
      sx += ring[i]![0]!
      sy += ring[i]![1]!
    }
    return [sx / Math.max(1, last), sy / Math.max(1, last)]
  }

  return [cx / (3 * twiceArea), cy / (3 * twiceArea)]
}

function ringAbsArea(ring: Ring): number {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i]![0]! * ring[i + 1]![1]! - ring[i + 1]![0]! * ring[i]![1]!
  }
  return Math.abs(a / 2)
}

/** Guaranteed-on-land anchor: area centroid, else densest interior sample. */
function interiorAnchor(ring: Ring): [number, number] {
  const c = ringAreaCentroid(ring)
  if (pointInRing(c[0], c[1], ring)) return c

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of ring) {
    minX = Math.min(minX, p[0]!)
    maxX = Math.max(maxX, p[0]!)
    minY = Math.min(minY, p[1]!)
    maxY = Math.max(maxY, p[1]!)
  }

  // Coarse grid — pick the sample farthest from the exterior (proxy for visual center).
  let best: [number, number] | null = null
  let bestScore = -1
  const steps = 14
  for (let iy = 0; iy <= steps; iy++) {
    for (let ix = 0; ix <= steps; ix++) {
      const lng = minX + ((maxX - minX) * ix) / steps
      const lat = minY + ((maxY - minY) * iy) / steps
      if (!pointInRing(lng, lat, ring)) continue
      // Distance-to-edge proxy: how many of 8 neighbors are also inside.
      let score = 0
      const d = Math.min(maxX - minX, maxY - minY) / steps
      for (const [dx, dy] of [
        [d, 0],
        [-d, 0],
        [0, d],
        [0, -d],
        [d, d],
        [d, -d],
        [-d, d],
        [-d, -d],
      ] as const) {
        if (pointInRing(lng + dx, lat + dy, ring)) score++
      }
      if (score > bestScore) {
        bestScore = score
        best = [lng, lat]
      }
    }
  }

  return best ?? c
}

function geometryCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  if (geometry.type === 'Polygon') {
    const outer = geometry.coordinates[0]
    return outer ? interiorAnchor(outer) : null
  }
  if (geometry.type === 'MultiPolygon') {
    let best: Ring | null = null
    let bestArea = -1
    for (const poly of geometry.coordinates) {
      const outer = poly[0]
      if (!outer) continue
      const a = ringAbsArea(outer)
      if (a > bestArea) {
        bestArea = a
        best = outer
      }
    }
    return best ? interiorAnchor(best) : null
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
