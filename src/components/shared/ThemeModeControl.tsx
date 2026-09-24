import { Moon, Sun } from 'lucide-react'
import { motion, MotionConfig, useReducedMotion } from 'motion/react'
import { useState } from 'react'

import { SPRING_THUMB } from '@/lib/ease'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/** Thumb travel inside the 3.35rem track (padding 4px + 20px thumb). */
const THUMB_X = { light: 0, dark: 22 } as const

/**
 * Light ↔ dark theme switch.
 *
 * Thumb position is transform-only (no `layout`) so route / content reflows
 * cannot nudge it — that was the header shift when switching My Care sections.
 */
export function ThemeModeControl({ className }: { className?: string }) {
  const theme = useUi((s) => s.theme)
  const setTheme = useUi((s) => s.setTheme)
  const dark = theme === 'dark'

  const reduce = useReducedMotion()
  const [isPressed, setIsPressed] = useState(false)
  const squish = isPressed && !reduce

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : SPRING_THUMB}>
      <motion.button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Dark' : 'Light'}
        onClick={() => setTheme(dark ? 'light' : 'dark')}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        initial={false}
        data-state={dark ? 'checked' : 'unchecked'}
        className={cn(
          'group relative inline-flex h-7 w-[3.35rem] shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          dark ? 'bg-primary' : 'bg-muted-foreground/55',
          className,
        )}
      >
        <Sun
          aria-hidden="true"
          strokeWidth={2.25}
          className={cn(
            'pointer-events-none absolute left-[7px] size-3 transition-opacity duration-200',
            dark ? 'text-primary-foreground/50' : 'text-white',
          )}
        />
        <Moon
          aria-hidden="true"
          strokeWidth={2.25}
          className={cn(
            'pointer-events-none absolute right-[7px] size-3 transition-opacity duration-200',
            dark ? 'text-primary-foreground' : 'text-white/45',
          )}
        />

        <motion.div
          initial={false}
          animate={{
            x: dark ? THUMB_X.dark : THUMB_X.light,
            scale: squish ? 0.9 : 1,
          }}
          className="pointer-events-none absolute left-1 top-1 z-10 size-5 rounded-full bg-[#0a0a0a] shadow-md"
        />
      </motion.button>
    </MotionConfig>
  )
}
