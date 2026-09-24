import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset window scroll on route change.
 *
 * Public pages (landing → demo) sit outside AppShell, so without this the
 * previous scroll offset carries over. Instant scroll avoids mid-paint jumps.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash])

  return null
}

/** Call from same-path links (e.g. footer → `/` while already on `/`). */
export function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}
