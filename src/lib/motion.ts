/**
 * Shared motion tokens for BayouCare.
 *
 * Keep transitions short (150–280ms), prefer opacity + transform, and always
 * gate theatrical motion behind `useReducedMotion` / `MotionConfig`. These
 * variants are intentionally subtle — polish, not performance.
 */

import type { Transition, Variants } from 'framer-motion'

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const duration = {
  fast: 0.15,
  normal: 0.22,
  slow: 0.28,
} as const

export const transitionFast: Transition = {
  duration: duration.fast,
  ease: EASE_OUT,
}

export const transitionNormal: Transition = {
  duration: duration.normal,
  ease: EASE_OUT,
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transitionNormal },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: transitionNormal,
  },
}

export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: transitionFast,
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: {
    opacity: 1,
    scale: 1,
    transition: transitionNormal,
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: transitionNormal,
  },
}

/** Instant variants when the user prefers reduced motion. */
export const reducedFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.01 } },
}
