import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { Loader } from '@/components/motion/loader'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { duration, EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** beUI-styled signing-in stage — logo plate + Loader morph. */
export function SigningInStage({
  title,
  detail,
  className,
}: {
  title: string
  detail?: string
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex w-full max-w-[400px] flex-col items-center justify-center px-6 py-10 text-center',
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: reduce ? 0.01 : duration.slow, ease: EASE_OUT }}
    >
      <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow)]">
        <BrandLogo
          size="lg"
          className="block w-full"
          imgClassName="!h-auto w-full object-cover"
        />
      </div>

      <div className="mt-7 text-primary">
        <Loader variant="comet" size={36} label={title} />
      </div>

      <p className="mt-5 text-base font-semibold text-foreground">{title}</p>
      {detail ? (
        <p className="mt-1.5 max-w-[18rem] text-sm text-muted-foreground">{detail}</p>
      ) : null}
    </motion.div>
  )
}

export function AuthFade({
  authKey,
  children,
}: {
  authKey: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()

  /*
   * Soft enter only — never `mode="wait"` with opacity→0. That produced a
   * full-viewport black frame between PendingShell and the signed-in app.
   */
  return (
    <motion.div
      key={authKey}
      className="min-h-dvh"
      initial={reduce ? false : { opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}
