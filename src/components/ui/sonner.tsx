import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useUi } from '@/store/ui'

const Toaster = ({ ...props }: ToasterProps) => {
  // BayouCare uses `[data-theme]` via the ui store — not next-themes.
  const theme = useUi((s) => s.theme) as ToasterProps['theme']

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="top-right"
      closeButton
      duration={4200}
      gap={10}
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" strokeWidth={1.75} />,
        info: <InfoIcon className="size-4 text-info" strokeWidth={1.75} />,
        warning: <TriangleAlertIcon className="size-4 text-warning" strokeWidth={1.75} />,
        error: <OctagonXIcon className="size-4 text-danger" strokeWidth={1.75} />,
        loading: (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" strokeWidth={1.75} />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            'border border-border bg-popover text-popover-foreground shadow-[var(--shadow-lg)]',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'border-border bg-card text-muted-foreground',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius-md)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
