// beui.dev/components/motion/text-animation

import {
  type MotionStyle,
  motion,
  type UseInViewOptions,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EASE_IN_OUT, EASE_OUT } from '@/lib/ease'
import { cn } from '@/lib/utils'

const CHROMATIC_PALETTE = [
  '#60a5fa',
  '#818cf8',
  '#c084fc',
  '#fb7185',
  '#fbbf24',
]

const TRAIL_HALF_WIDTH = 14
const REVEAL_START = `-${TRAIL_HALF_WIDTH}%`
const REVEAL_FINISH = `${100 + TRAIL_HALF_WIDTH}%`

type Phase = 'in' | 'hold' | 'out'

export type ChromaticTextRevealProps = {
  /** Sentence fragment that remains fixed while the final word changes. */
  prefix: string
  /** Words revealed one after another after the fixed prefix. */
  words: string[]
  /** Colors used along the moving chromatic edge. */
  colors?: string[]
  /** Final text color after the sweep passes. */
  foregroundColor?: string
  /** Forward sweep duration in seconds. */
  duration?: number
  /** Reverse (trail-back) sweep duration in seconds. */
  retractDuration?: number
  /** Delay before the first sweep, in seconds. */
  delay?: number
  /** Rest after a word finishes revealing, in seconds. */
  pauseDuration?: number
  /** Returns to the first word after the final word. */
  loop?: boolean
  /** Starts when the text enters the viewport. */
  startOnView?: boolean
  /** Only starts on the first viewport entry. */
  once?: boolean
  /** IntersectionObserver root margin used by the viewport trigger. */
  inViewMargin?: UseInViewOptions['margin']
  className?: string
}

function composeChromaticGradient(colors: string[], foregroundColor: string) {
  const palette = colors.length > 0 ? colors : CHROMATIC_PALETTE
  const colorStops = palette.map((color, index) => {
    const offset =
      palette.length === 1
        ? 0
        : -TRAIL_HALF_WIDTH +
          (index / (palette.length - 1)) * TRAIL_HALF_WIDTH * 2
    const operator = offset < 0 ? '-' : '+'
    const distance = Number(Math.abs(offset).toFixed(2))
    return `${color} calc(var(--chromatic-sweep) ${operator} ${distance}%)`
  })

  return `linear-gradient(90deg, ${foregroundColor} 0%, ${foregroundColor} calc(var(--chromatic-sweep) - ${TRAIL_HALF_WIDTH}%), ${colorStops.join(', ')}, transparent calc(var(--chromatic-sweep) + ${TRAIL_HALF_WIDTH}%), transparent 100%)`
}

export function ChromaticTextReveal({
  prefix,
  words,
  colors = CHROMATIC_PALETTE,
  foregroundColor = 'var(--foreground)',
  duration = 1.2,
  retractDuration = 0.75,
  delay = 0,
  pauseDuration = 0.8,
  loop = true,
  startOnView = true,
  once = true,
  inViewMargin,
  className,
}: ChromaticTextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | null>(null)
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('in')
  const reduceMotion = useReducedMotion()
  const isInView = useInView(ref, {
    once,
    margin: inViewMargin,
    amount: 0.4,
  })
  const shouldReveal = !startOnView || isInView || reduceMotion
  const backgroundImage = composeChromaticGradient(colors, foregroundColor)
  const hasWords = words.length > 0
  const activeIndex = hasWords ? wordIndex % words.length : 0
  const activeWord = words[activeIndex] ?? ''
  const sizingWords = Array.from(new Set(words))

  const clearPending = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearPending, [clearPending])

  // Reset to forward reveal when the active word changes.
  useEffect(() => {
    setPhase('in')
  }, [activeIndex])

  const advanceWord = useCallback(() => {
    const isLastWord = activeIndex === words.length - 1
    if (words.length < 2 || (isLastWord && !loop)) return
    setWordIndex((index) => (index + 1) % words.length)
  }, [activeIndex, loop, words.length])

  const phaseRef = useRef<Phase>('in')
  phaseRef.current = phase
  const completingRef = useRef(false)

  const onSweepComplete = useCallback(() => {
    if (reduceMotion || !shouldReveal) return
    // Multiple CSS props finish — only handle the first completion per phase.
    if (completingRef.current) return
    completingRef.current = true

    const current = phaseRef.current
    if (current === 'in') {
      const isLastWord = activeIndex === words.length - 1
      if (words.length < 2 || (isLastWord && !loop)) {
        completingRef.current = false
        return
      }
      clearPending()
      timerRef.current = window.setTimeout(() => {
        completingRef.current = false
        setPhase('out')
      }, pauseDuration * 1000)
      return
    }

    if (current === 'out') {
      completingRef.current = false
      advanceWord()
    }
  }, [
    activeIndex,
    advanceWord,
    clearPending,
    loop,
    pauseDuration,
    reduceMotion,
    shouldReveal,
    words.length,
  ])

  useEffect(() => {
    completingRef.current = false
  }, [phase, activeIndex])

  const sweepTarget =
    reduceMotion || !shouldReveal
      ? REVEAL_FINISH
      : phase === 'out'
        ? REVEAL_START
        : REVEAL_FINISH

  const sweepDuration =
    phase === 'out' ? retractDuration : duration

  return (
    <span ref={ref} className={cn('inline-flex items-baseline', className)}>
      <span className="whitespace-nowrap">
        {prefix}
        {hasWords ? '\u00A0' : null}
      </span>
      {hasWords ? (
        <span className="relative inline-grid">
          {sizingWords.map((word) => (
            <span
              key={word}
              aria-hidden
              className="invisible col-start-1 row-start-1 whitespace-nowrap"
            >
              {word}
            </span>
          ))}
          <motion.span
            key={activeWord}
            aria-hidden
            initial={
              reduceMotion
                ? false
                : {
                    '--chromatic-sweep': REVEAL_START,
                    opacity: 0.7,
                    filter: 'blur(4px)',
                    transform: 'translateY(4px)',
                  }
            }
            animate={{
              '--chromatic-sweep': sweepTarget,
              opacity: phase === 'out' ? 0.85 : 1,
              filter: 'blur(0px)',
              transform: 'translateY(0px)',
            }}
            transition={{
              '--chromatic-sweep': reduceMotion
                ? { duration: 0 }
                : {
                    duration: sweepDuration,
                    delay: phase === 'in' ? delay : 0,
                    ease: EASE_IN_OUT,
                  },
              opacity: reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: EASE_OUT },
              filter: reduceMotion
                ? { duration: 0 }
                : { duration: 0.28, ease: EASE_OUT },
              transform: reduceMotion
                ? { duration: 0 }
                : { duration: 0.28, ease: EASE_OUT },
            }}
            onAnimationComplete={onSweepComplete}
            className="absolute start-0 top-0 whitespace-nowrap bg-clip-text text-transparent [background-image:var(--chromatic-gradient)] [contain:paint]"
            style={
              {
                '--chromatic-sweep': reduceMotion ? REVEAL_FINISH : REVEAL_START,
                '--chromatic-gradient': backgroundImage,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              } as MotionStyle
            }
          >
            {activeWord}
          </motion.span>
          <span className="sr-only">{activeWord}</span>
        </span>
      ) : null}
    </span>
  )
}
