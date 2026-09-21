import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogAction,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  /** `danger` for destructive actions; the confirm button turns coral. */
  tone?: 'default' | 'danger'
}

/**
 * A confirmation dialog for an action that changes something.
 *
 * The app had no dialogs at all before this — every confirmation was a toast,
 * which announces the result but never asks. Cancel and reschedule both need a
 * real "are you sure", both for the patient and because the appointment list is
 * the one screen where a mis-tap loses something.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = 'default',
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <DialogFooter>
          {/* Cancel comes first in the DOM and is the default focus target, so
              Enter on an untouched dialog does not destroy anything. */}
          <DialogClose asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </DialogClose>
          <DialogAction>
            <Button
              variant={tone === 'danger' ? 'destructive' : 'default'}
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </DialogAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
