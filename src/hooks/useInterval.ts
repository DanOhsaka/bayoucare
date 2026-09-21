import { useEffect, useRef } from 'react'

/**
 * `setInterval` that lives and dies with the component.
 *
 * The legacy app ran five of these and cleared NONE of them on navigation —
 * the temp ticker, the 2am replay, the parish van tour, and two admin log
 * runners all kept firing against DOM that was no longer on screen. Putting the
 * cleanup in the effect is what makes that class of leak structurally
 * impossible rather than something to remember.
 *
 * Pass `null` for `ms` to pause without unmounting.
 */
export function useInterval(callback: () => void, ms: number | null) {
  const ref = useRef(callback)
  ref.current = callback

  useEffect(() => {
    if (ms == null) return
    const id = setInterval(() => ref.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}
