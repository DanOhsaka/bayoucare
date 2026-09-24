import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

import { EASE_OUT } from '@/lib/ease'
import { cn } from '@/lib/utils'

/**
 * Enter-only route transition for the main content pane.
 *
 * Intentionally has no exit animation and never reaches opacity 0 — that was
 * the blank dark frame between tabs. Old content unmounts; new content lands
 * nearly opaque and settles in ~180ms.
 */
export function RouteEnter({
  children,
  className,
  /** When true, treat all `/my-care/*` paths as one key (layout owns section swaps). */
  stabilizeMyCare = false,
}: {
  children: ReactNode
  className?: string
  stabilizeMyCare?: boolean
}) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const key =
    stabilizeMyCare && pathname.startsWith('/my-care') ? '/my-care' : pathname

  return (
    <motion.div
      key={key}
      initial={reduce ? false : { opacity: 0.88, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.18, ease: EASE_OUT }
      }
      className={cn('min-w-0', className)}
    >
      {children}
    </motion.div>
  )
}
