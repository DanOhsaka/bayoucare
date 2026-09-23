import { motion } from 'motion/react'

import { EASE_OUT } from '@/lib/ease'
import { cn } from '@/lib/utils'

/**
 * Aceternity-style 3D pin — adapted as a map marker anchor (not a product link).
 * Vertical stem + floating label + base ripples; BayouCare brand green.
 */
export function Map3DPin({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return (
    <motion.div
      className={cn('pointer-events-none relative flex flex-col items-center', className)}
      initial={{ opacity: 0, y: -12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.92 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      <motion.div
        className="relative z-10 rounded-full border border-brand-500/40 bg-card/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-foreground shadow-[var(--shadow)] backdrop-blur-sm"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: EASE_OUT }}
      >
        {title}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-brand-500/40 bg-card/95"
        />
      </motion.div>

      <div className="relative mt-1 flex h-[4.25rem] w-px flex-col items-center">
        <span className="h-full w-px bg-gradient-to-b from-brand-500 via-brand-500/70 to-transparent" />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-[3px] -translate-x-px bg-gradient-to-b from-brand-400/35 to-transparent blur-[2px]"
        />
      </div>

      <div className="relative -mt-1 flex size-4 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute size-8 animate-[pin-ripple_1.8s_ease-out_infinite] rounded-full border border-brand-500/35"
        />
        <span
          aria-hidden="true"
          className="absolute size-5 animate-[pin-ripple_1.8s_ease-out_infinite] rounded-full border border-brand-500/50 [animation-delay:0.35s]"
        />
        <span className="relative size-2.5 rounded-full bg-brand-600 shadow-[0_0_10px_rgba(20,149,103,0.55)] ring-2 ring-brand-500/40" />
      </div>
    </motion.div>
  )
}
