/**
 * Demo patient home anchors for Access & Help mapping.
 *
 * PRIVACY: these are APPROXIMATE neighborhood centroids (city-level, rounded),
 * not street addresses or precise residences. They exist only so the demo can
 * show "near me" without inventing a permanent street-level home. Real product
 * wiring should geocode an authorized patient address server-side and return
 * a coarse point — never log or put precise coordinates in URLs/analytics.
 */

import type { PatientId } from '@/data'

export type TravelMode = 'drive' | 'walk'

export interface DemoHome {
  /** Coarse lat — intentionally ~2 decimal places (~1 km). */
  lat: number
  lng: number
  /** Human label that does NOT include a street number. */
  label: string
  city: string
}

/**
 * Neighborhood-level anchors keyed by demo patient. Values are rounded so they
 * cannot be reverse-geocoded to a specific dwelling.
 */
export const DEMO_HOMES: Record<PatientId, DemoHome> = {
  darlene: {
    lat: 31.31,
    lng: -92.45,
    label: 'Near downtown Alexandria',
    city: 'Alexandria',
  },
  priscilla: {
    lat: 30.27,
    lng: -91.9,
    label: 'Near Breaux Bridge',
    city: 'Breaux Bridge',
  },
  yolanda: {
    lat: 31.31,
    lng: -92.44,
    label: 'Near Alexandria',
    city: 'Alexandria',
  },
  marcus: {
    lat: 32.51,
    lng: -92.12,
    label: 'Near Monroe',
    city: 'Monroe',
  },
}
