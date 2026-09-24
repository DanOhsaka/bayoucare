/**
 * Build the shareable Family help invite copy and deep link.
 * Delivery is via the device mail/SMS client (or Resend when configured).
 */

export function familyInviteAppUrl(): string {
  if (typeof window === 'undefined') return 'https://bayoucare.demo/#/login'
  const { origin, pathname } = window.location
  // Hash router — land on login so a family member can open the shared chart.
  return `${origin}${pathname}#/login`
}

export function familyInviteSubject(patientFirst: string): string {
  return `${patientFirst} invited you to BayouCare Family help`
}

export function familyInviteBody(patientFirst: string, inviteeName: string): string {
  const url = familyInviteAppUrl()
  return [
    `Hi${inviteeName ? ` ${inviteeName}` : ''},`,
    '',
    `${patientFirst} asked you to help on BayouCare — shared tasks, the next visit, and rides on their care chart.`,
    '',
    `Open BayouCare and sign in (or use a demo account):`,
    url,
    '',
    `Then go to My Care → Family help.`,
    '',
    `— BayouCare`,
  ].join('\n')
}

/** Prefer iOS `&body=` vs Android `?body=` so SMS apps prefill reliably. */
export function smsComposeHref(phone: string, body: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const sep = ios ? '&' : '?'
  return `sms:${digits}${sep}body=${encodeURIComponent(body)}`
}

export function mailtoComposeHref(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Try server email (Resend) when configured; otherwise open the device composer.
 * Returns how delivery was handed off.
 */
export async function deliverFamilyInvite(opts: {
  patientFirst: string
  inviteeName: string
  email?: string
  phone?: string
}): Promise<'email' | 'sms' | 'email+sms' | 'share'> {
  const subject = familyInviteSubject(opts.patientFirst)
  const body = familyInviteBody(opts.patientFirst, opts.inviteeName)
  const email = opts.email?.trim()
  const phone = opts.phone?.trim()

  let emailed = false
  if (email) {
    try {
      const res = await fetch('/api/family-invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          to: email,
          name: opts.inviteeName,
          subject,
          text: body,
        }),
      })
      if (res.ok) {
        emailed = true
      } else {
        window.location.href = mailtoComposeHref(email, subject, body)
        emailed = true
      }
    } catch {
      window.location.href = mailtoComposeHref(email, subject, body)
      emailed = true
    }
  }

  let texted = false
  if (phone) {
    // Small delay so mailto can open first when both are set.
    const openSms = () => {
      window.location.href = smsComposeHref(phone, body)
    }
    if (emailed) setTimeout(openSms, 400)
    else openSms()
    texted = true
  }

  if (emailed && texted) return 'email+sms'
  if (emailed) return 'email'
  if (texted) return 'sms'
  return 'share'
}
