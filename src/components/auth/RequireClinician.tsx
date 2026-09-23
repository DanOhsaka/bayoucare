import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useSession } from '@/store/session'

/**
 * Blocks patient sessions from clinician-only routes.
 *
 * The mode switch and nav tabs already hide admin UI for patients, but routes
 * were still reachable by URL / the Overview "For evaluators" panel. That made
 * signing in decorative for the god-view — this closes that door.
 */
export function RequireClinician({ children }: { children: ReactNode }) {
  const role = useSession((s) => s.role)
  if (role !== 'clinician') return <Navigate to="/overview" replace />
  return children
}
