import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset window scroll on every route change.
 *
 * Public pages (landing → demo carousel) sit outside AppShell, so without this
 * the previous page's scroll offset carries over and you land on the footer.
 * `useLayoutEffect` + `instant` avoids a smooth jump mid-paint.
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
