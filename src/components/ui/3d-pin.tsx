import { motion } from 'motion/react'

import { EASE_OUT } from '@/lib/ease'
import { cn } from '@/lib/utils'

/**
 * Compact parish selection pin — small footprint so clinic markers/popups stay readable.
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
        'pointer-events-none relative flex w-max flex-col items-center',
        className,
      )}
      initial={{ opacity: 0, y: 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
    >
      <motion.div
        className="relative z-20 mb-0.5 rounded-md border border-brand-500/45 bg-card px-2 py-0.5 text-[10px] font-bold tracking-wide text-foreground shadow-[var(--shadow-sm)]"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.04, ease: EASE_OUT }}
      >
        {title}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rotate-45 border-b border-r border-brand-500/45 bg-card"
        />
      </motion.div>

      <div className="relative z-10 flex h-8 w-[2px] flex-col items-center">
        <span className="h-full w-[2px] rounded-full bg-gradient-to-b from-brand-500 via-brand-500 to-brand-500/25" />
      </div>

      <div className="relative z-0 -mt-0.5 flex size-3 items-center justify-center">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 rounded-full bg-brand-500/20 ring-1 ring-brand-400/30"
            style={{ width: 28, height: 28, marginLeft: -14, marginTop: -14 }}
            initial={{ opacity: 0, scale: 0.45 }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.45, 1.1, 1.3],
            }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.5,
            }}
          />
        ))}
        <span className="relative z-10 size-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(20,149,103,0.8)] ring-2 ring-brand-400/45" />
      </div>
    </motion.div>
  )
}
