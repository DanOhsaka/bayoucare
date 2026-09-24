import { MapPin, Clock, Navigation, Phone, Cross } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { TiltCard } from '@/components/motion/tilt-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NearbyClinic } from '@/engine/access/nearby'
import { externalDirectionsUrl } from '@/engine/access/geo'
import { transitionFast, transitionNormal } from '@/lib/motion'

/** Cross-fade + slight rise when a metric string changes (Drive ↔ Walk, new route). */
function AnimatedMetric({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <span className={cn('relative inline-grid tabular-nums', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={reduce ? { duration: 0.01 } : transitionFast}
          className="col-start-1 row-start-1"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function ClinicCard({
  clinic,
  selected,
  onSelect,
}: {
  clinic: NearbyClinic
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div className="[perspective:900px]">
      <TiltCard
        max={selected ? 6 : 10}
        glare
        className={cn(
          'rounded-2xl border shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-200',
          selected
            ? 'border-brand-600 bg-accent shadow-[var(--shadow)] ring-1 ring-brand-600/30'
            : 'border-border bg-card hover:border-brand-600/45',
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="relative z-[1] w-full p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                'mt-0.5 flex size-9 flex-none items-center justify-center rounded-xl transition-colors duration-200',
                selected ? 'bg-brand-700 text-on-dark' : 'bg-muted text-muted-foreground',
              )}
              aria-hidden="true"
            >
              <Cross className="size-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-card-foreground">{clinic.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden="true" strokeWidth={1.75} />
                  <AnimatedMetric value={clinic.distanceLabel} />
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" strokeWidth={1.75} />
                  <AnimatedMetric value={clinic.etaLabel} />
                </span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {clinic.services.slice(0, 3).join(' · ')}
              </p>
              {clinic.hours ? (
                <Badge variant="neutral" className="mt-2">
                  {clinic.hours}
                </Badge>
              ) : null}
            </div>
          </div>
        </button>
      </TiltCard>
    </div>
  )
}

export function RouteSummary({
  fromLabel,
  clinic,
  distanceLabel,
  etaLabel,
  routeNote,
  pending,
}: {
  fromLabel: string
  clinic: NearbyClinic
  distanceLabel?: string
  etaLabel?: string
  routeNote?: string
  pending?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-opacity duration-300',
        pending && 'opacity-80',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="typo-label">Route</p>
        {pending ? (
          <span className="text-xs font-semibold text-muted-foreground motion-safe:animate-pulse">
            Updating…
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">From</p>
          <p className="text-sm font-semibold text-card-foreground">{fromLabel}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">To</p>
          <p className="text-sm font-semibold text-card-foreground">{clinic.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="typo-metric text-xl">
            <AnimatedMetric value={distanceLabel ?? clinic.distanceLabel} />
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estimated travel</p>
          <p className="typo-metric text-xl">
            <AnimatedMetric value={etaLabel ?? clinic.etaLabel} />
          </p>
        </div>
      </div>
      {routeNote ? <p className="mt-2 text-xs text-muted-foreground">{routeNote}</p> : null}

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          <span>{clinic.address}</span>
        </p>
        {clinic.phone ? (
          <p className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
            <a href={`tel:${clinic.phone.replace(/\D/g, '')}`} className="text-link hover:underline">
              {clinic.phone}
            </a>
          </p>
        ) : null}
        <p className="text-xs">{clinic.services.join(' · ')}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="font-bold"
          onClick={() => {
            window.open(externalDirectionsUrl(clinic), '_blank', 'noopener,noreferrer')
          }}
        >
          <Navigation className="size-3.5" aria-hidden="true" strokeWidth={2} />
          Get directions
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Opens an external maps app with this clinic as the destination. Your home
        coordinates are never placed in the link.
      </p>
    </div>
  )
}

export function TravelModeToggle({
  mode,
  onChange,
}: {
  mode: 'drive' | 'walk'
  onChange: (m: 'drive' | 'walk') => void
}) {
  const reduce = useReducedMotion()

  return (
    <div
      role="group"
      aria-label="Travel mode"
      className="relative inline-flex rounded-md border border-border bg-muted/50 p-0.5"
    >
      {(
        [
          ['drive', 'Drive'],
          ['walk', 'Walk'],
        ] as const
      ).map(([value, label]) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={cn(
              'relative z-10 rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors duration-200',
              active ? 'text-card-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId={reduce ? undefined : 'travel-mode-pill'}
                className="absolute inset-0 -z-10 rounded-sm bg-card shadow-[var(--shadow-sm)]"
                transition={reduce ? { duration: 0.01 } : transitionNormal}
              />
            ) : null}
            {label}
          </button>
        )
      })}
    </div>
  )
}
