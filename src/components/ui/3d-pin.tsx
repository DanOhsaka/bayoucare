import { motion } from 'motion/react'

import { EASE_OUT } from '@/lib/ease'
import { cn } from '@/lib/utils'

/**
 * Aceternity-style 3D pin for map markers.
 * Base sits on the parish (marker anchor = bottom); stem + label rise above;
 * concentric soft discs pulse at the base like the Aceternity demo.
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
      className={cn(
        'bc-parish-pin pointer-events-none relative flex w-max flex-col items-center',
        className,
      )}
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: EASE_OUT }}
    >
      {/* Floating title */}
      <motion.div
        className="relative z-20 mb-1.5 rounded-full border border-brand-500/50 bg-card px-3 py-1.5 text-xs font-bold tracking-wide text-foreground shadow-[var(--shadow)]"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: EASE_OUT }}
      >
        {title}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-brand-500/50 bg-card"
        />
      </motion.div>

      {/* Vertical stem — thicker so it reads on a busy street basemap */}
      <div className="relative z-10 flex h-[5.25rem] w-[2px] flex-col items-center">
        <span className="h-full w-[2px] rounded-full bg-gradient-to-b from-brand-500 via-brand-500 to-brand-500/30" />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-[6px] -translate-x-[2px] bg-gradient-to-b from-brand-400/50 to-transparent blur-[3px]"
        />
      </div>

      {/* Base: glowing dot + radiating discs */}
      <div className="relative z-0 -mt-0.5 flex size-4 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 rounded-full bg-brand-500/20 shadow-[0_0_16px_rgba(20,149,103,0.35)] ring-1 ring-brand-400/40"
            style={{ width: 88, height: 88, marginLeft: -44, marginTop: -44 }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 0.65, 0.3, 0],
              scale: [0.3, 0.8, 1.1, 1.4],
            }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.5,
            }}
          />
        ))}
        <span className="relative z-10 size-3 rounded-full bg-brand-500 shadow-[0_0_18px_rgba(20,149,103,0.9)] ring-[3px] ring-brand-400/55" />
      </div>
    </motion.div>
  )
}
