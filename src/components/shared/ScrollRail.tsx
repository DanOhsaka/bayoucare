import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Horizontal feature rail with chevrons instead of a native scrollbar.
 *
 * Used for the My Care section strip on narrow viewports — overflow was
 * reachable only via a platform scrollbar most people never notice, and on
 * Windows it painted as a thick gray track under the pills.
 */
export function ScrollRail({
  children,
  className,
  contentClassName,
  'aria-label': ariaLabel,
  activeKey,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
  'aria-label'?: string
  /** When this changes, re-measure and center the active item. */
  activeKey?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanLeft(el.scrollLeft > 4)
    setCanRight(max > 4 && el.scrollLeft < max - 4)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    update()
    const active = el.querySelector<HTMLElement>('[aria-current="page"], [data-active="true"]')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeKey, update])

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Scroll sections left"
        disabled={!canLeft}
        onClick={() => scrollByDir(-1)}
        className={cn(
          'absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-sm)] transition-opacity',
          canLeft ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Scroll sections right"
        disabled={!canRight}
        onClick={() => scrollByDir(1)}
        className={cn(
          'absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-sm)] transition-opacity',
          canRight ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-card to-transparent transition-opacity',
          canLeft ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-card to-transparent transition-opacity',
          canRight ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={scrollerRef}
        role="navigation"
        aria-label={ariaLabel}
        className={cn(
          'bc-scroll-rail flex gap-1 overflow-x-auto overscroll-x-contain scroll-smooth px-8 py-0.5',
          'snap-x snap-mandatory',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
