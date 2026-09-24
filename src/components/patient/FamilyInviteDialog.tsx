import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

import { Field, INPUT_CLASS } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deliverFamilyInvite, familyInviteAppUrl, familyInviteBody } from '@/lib/familyInvite'
import { useT } from '@/hooks/useT'
import { useActivePatient, usePatient } from '@/store/patient'
import { useFamily } from '@/store/family'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Invite a family member via their email and/or phone.
 *
 * Delivery: Resend when `RESEND_API_KEY` is set on the server; otherwise the
 * device mail / SMS composer opens with a prefilled message so the invite
 * actually goes out from the patient's own accounts.
 */
export function FamilyInviteDialog({ open, onOpenChange }: Props) {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = useActivePatient()
  const addInvite = useFamily((s) => s.addInvite)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const firstName = patient.name.split(' ')[0] || patient.name

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setBusy(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const invitee = name.trim()
    const em = email.trim()
    const ph = phone.trim()

    if (!invitee) {
      toast.error(t('fam.inviteNeedName'))
      return
    }
    if (!em && !ph) {
      toast.error(t('fam.inviteNeedContact'))
      return
    }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error(t('fam.inviteBadEmail'))
      return
    }

    setBusy(true)
    try {
      const delivery = await deliverFamilyInvite({
        patientFirst: firstName,
        inviteeName: invitee,
        email: em || undefined,
        phone: ph || undefined,
      })

      const channel =
        em && ph ? 'both' : em ? 'email' : 'sms'

      addInvite({
        patientId: pid,
        name: invitee,
        email: em || undefined,
        phone: ph || undefined,
        channel,
        delivery,
      })

      toast.success(
        delivery === 'email'
          ? t('fam.inviteSentEmail', { name: invitee })
          : delivery === 'sms'
            ? t('fam.inviteSentSms', { name: invitee })
            : t('fam.inviteSentBoth', { name: invitee }),
      )
      reset()
      onOpenChange(false)
    } catch {
      toast.error(t('fam.inviteFailed'))
      setBusy(false)
    }
  }

  async function onShareLink() {
    const body = familyInviteBody(firstName, name.trim() || 'there')
    const url = familyInviteAppUrl()
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('fam.inviteTitle'),
          text: body,
          url,
        })
        addInvite({
          patientId: pid,
          name: name.trim() || t('fam.inviteShareGuest'),
          channel: 'email',
          delivery: 'share',
        })
        toast.success(t('fam.inviteShared'))
        onOpenChange(false)
        return
      }
    } catch {
      /* user cancelled share sheet */
      return
    }
    try {
      await navigator.clipboard.writeText(`${body}\n`)
      toast.success(t('fam.inviteCopied'))
    } catch {
      toast.message(url)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <UserPlus className="size-4 text-brand-600" aria-hidden="true" />
            {t('fam.inviteTitle')}
          </DialogTitle>
          <DialogDescription>{t('fam.inviteSub', { name: firstName })}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)}>
          <Field label={t('fam.inviteName')} id="fam-invite-name">
            <input
              id="fam-invite-name"
              className={INPUT_CLASS}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fam.inviteNamePh')}
              required
            />
          </Field>
          <Field label={t('fam.inviteEmail')} id="fam-invite-email">
            <input
              id="fam-invite-email"
              type="email"
              className={INPUT_CLASS}
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('fam.inviteEmailPh')}
            />
          </Field>
          <Field label={t('fam.invitePhone')} id="fam-invite-phone">
            <input
              id="fam-invite-phone"
              type="tel"
              className={INPUT_CLASS}
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('fam.invitePhonePh')}
            />
          </Field>
          <p className="text-xs text-muted-foreground">{t('fam.inviteHint')}</p>

          <DialogFooter className="mt-1 flex-col gap-2 sm:flex-col">
            <Button type="submit" className="w-full font-bold" disabled={busy}>
              {busy ? t('fam.inviteSending') : t('fam.inviteSend')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => void onShareLink()}
            >
              {t('fam.inviteShare')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InviteFamilyButton({
  className,
  size = 'sm',
}: {
  className?: string
  size?: 'xs' | 'sm' | 'default'
}) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        size={size}
        className={cn('font-bold', className)}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-3.5" aria-hidden="true" />
        {t('fam.inviteCta')}
      </Button>
      <FamilyInviteDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
