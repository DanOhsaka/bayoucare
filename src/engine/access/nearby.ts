import clinicsJson from '@/data/nearbyClinics.json'
import { DEMO_HOMES, type DemoHome, type TravelMode } from '@/data/demoHomes'
import type { PatientId } from '@/data'
import {
  estimateTravel,
  formatMiles,
  formatMinutes,
  haversineMiles,
} from '@/engine/access/geo'

export type ClinicKind = 'hospital' | 'clinic'

export interface ClinicRecord {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  phone: string
  hours: string
  services: string[]
  kind: ClinicKind
}

export interface NearbyClinic extends ClinicRecord {
  distanceMiles: number
  etaMinutes: number
  distanceLabel: string
  etaLabel: string
}

const ALL = clinicsJson as ClinicRecord[]

/** Radius (mi) for "nearby" — keep the list focused for the demo. */
const NEARBY_RADIUS_MI = 35
const WIDE_RADIUS_MI = 65

export function getDemoHome(pid: PatientId): DemoHome {
  return DEMO_HOMES[pid]
}

export function clinicsNearHome(
  home: DemoHome,
  mode: TravelMode,
  opts?: { wide?: boolean },
): NearbyClinic[] {
  const radius = opts?.wide ? WIDE_RADIUS_MI : NEARBY_RADIUS_MI
  return ALL.map((c) => {
    const distanceMiles = haversineMiles(home, c)
    const { minutes } = estimateTravel(distanceMiles, mode)
    return {
      ...c,
      distanceMiles,
      etaMinutes: minutes,
      distanceLabel: formatMiles(distanceMiles),
      etaLabel: formatMinutes(minutes),
    }
  })
    .filter((c) => c.distanceMiles <= radius)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
}

export type SortKey = 'nearest' | 'fastest'

export function sortClinics(list: NearbyClinic[], key: SortKey): NearbyClinic[] {
  const copy = [...list]
  if (key === 'fastest') {
    copy.sort((a, b) => a.etaMinutes - b.etaMinutes || a.distanceMiles - b.distanceMiles)
  } else {
    copy.sort((a, b) => a.distanceMiles - b.distanceMiles)
  }
  return copy
}
