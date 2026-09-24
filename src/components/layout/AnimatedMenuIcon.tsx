import { cn } from '@/lib/utils'

/**
 * Menu ↔ close morph from Aaron Iker’s Dribbble micro-interaction
 * (https://dribbble.com/shots/10060846-menu-icon-micro-interaction),
 * remade in CSS by Mikael Ainalem — line segments slide onto circular arcs.
 */
export function AnimatedMenuIcon({
  open,
  className,
}: {
  open: boolean
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      aria-hidden="true"
      data-open={open ? 'true' : 'false'}
      className={cn('menu-icon size-[2.875rem] text-foreground', className)}
    >
      <g fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round">
        <path d="M72 82.286h28.75" />
        <path d="M100.75 103.714l72.482-.143c.043 39.398-32.284 71.434-72.16 71.434-39.878 0-72.204-32.036-72.204-71.554" />
        <path d="M72 125.143h28.75" />
        <path d="M100.75 103.714l-71.908-.143c.026-39.638 32.352-71.674 72.23-71.674 39.876 0 72.203 32.036 72.203 71.554" />
        <path d="M100.75 82.286h28.75" />
        <path d="M100.75 125.143h28.75" />
      </g>
    </svg>
  )
}
