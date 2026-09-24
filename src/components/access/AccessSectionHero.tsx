import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { TiltCard } from '@/components/motion/tilt-card'
import { Badge } from '@/components/ui/badge'
import { duration, EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'map'

/**
 * Lively Access section intro — beUI TiltCard + display type + soft atmosphere.
 */
export function AccessSectionHero({
  title,
  subtitle,
  badge,
  icon: Icon,
  tone = 'brand',
  className,
  children,
  tiltMax = 10,
}: {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  icon?: LucideIcon
  tone?: Tone
  className?: string
  children?: ReactNode
  /** Lower for embedded headers (e.g. map band). */
  tiltMax?: number
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : duration.normal, ease: EASE_OUT }}
      className={cn('[perspective:1200px]', className)}
    >
      <TiltCard
        max={tiltMax}
        glare
        className={cn(
          'rounded-3xl border border-border/70 shadow-[var(--shadow-sm)]',
          tone === 'brand'
            ? 'bg-gradient-to-br from-brand-700/18 via-card to-card dark:from-brand-500/20'
            : 'bg-gradient-to-br from-sky-600/15 via-card to-card dark:from-sky-500/15',
        )}
      >
        {/* Atmosphere — soft orbs + hairline grid */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -right-16 -top-20 size-56 rounded-full blur-3xl',
              tone === 'brand' ? 'bg-brand-500/25' : 'bg-sky-400/20',
            )}
          />
          <div
            className={cn(
              'absolute -bottom-24 -left-12 size-52 rounded-full blur-3xl',
              tone === 'brand' ? 'bg-brand-800/20' : 'bg-emerald-500/15',
            )}
          />
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
            style={{
              backgroundImage:
                tone === 'map'
                  ? 'radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 0)'
                  : 'linear-gradient(135deg, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px)',
              backgroundSize: tone === 'map' ? '18px 18px' : '22px 22px',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3.5">
              {Icon ? (
                <span
                  className={cn(
                    'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-[var(--shadow-sm)] ring-1',
                    tone === 'brand'
                      ? 'bg-brand-700 text-on-dark ring-brand-600/40'
                      : 'bg-sky-700 text-white ring-sky-500/30 dark:bg-sky-600',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" strokeWidth={1.85} />
                </span>
              ) : null}
              <div className="min-w-0 space-y-1.5">
                <h2 className="text-balance font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {badge ? (
              typeof badge === 'string' ? (
                <Badge
                  variant={tone === 'brand' ? 'success' : 'neutral'}
                  className="shrink-0 shadow-[var(--shadow-sm)]"
                >
                  {badge}
                </Badge>
              ) : (
                badge
              )
            ) : null}
          </div>

          {children}
        </div>
      </TiltCard>
    </motion.div>
  )
}

/** Split "Title — accent" so the second clause can carry brand color. */
export function AccessTitleSplit({ text }: { text: string }) {
  const parts = text.split(/\s+[—–-]\s+/)
  if (parts.length < 2) return <>{text}</>
  const [lead, ...rest] = parts
  return (
    <>
      {lead}
      <span className="text-muted-foreground"> — </span>
      <span className="text-brand-600 dark:text-brand-500">{rest.join(' — ')}</span>
    </>
  )
}
