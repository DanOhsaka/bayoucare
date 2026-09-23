import { type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

import {
  fadeUp,
  fadeUpSm,
  reducedFade,
  staggerContainer,
  staggerItem,
  transitionNormal,
} from '@/lib/motion'
import { cn } from '@/lib/utils'

type DivProps = HTMLMotionProps<'div'>

function useEntranceVariants(full = true) {
  const reduce = useReducedMotion()
  if (reduce) return reducedFade
  return full ? fadeUp : fadeUpSm
}

/** Route / screen entrance — keyed by the caller (usually pathname). */
export function PageFade({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & Omit<DivProps, 'children'>) {
  const variants = useEntranceVariants(false)

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Staggered children for dashboard card grids. */
export function Stagger({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & Omit<DivProps, 'children'>) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={reduce ? reducedFade : staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & Omit<DivProps, 'children'>) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      variants={reduce ? reducedFade : staggerItem}
      className={cn('min-w-0', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Soft fade when content replaces a skeleton. */
export function ContentFade({
  children,
  className,
  showKey,
}: {
  children: ReactNode
  className?: string
  showKey?: string | number
}) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showKey ?? 'content'}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={reduce ? { duration: 0.01 } : transitionNormal}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/** Chat / list row entrance. */
export function MessageIn({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0.01 } : transitionNormal}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function InteractiveLift({
  children,
  className,
  enabled = true,
}: {
  children: ReactNode
  className?: string
  enabled?: boolean
}) {
  const reduce = useReducedMotion()

  if (!enabled || reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={transitionNormal}
    >
      {children}
    </motion.div>
  )
}
