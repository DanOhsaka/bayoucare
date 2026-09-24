import { useEffect, useRef } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/react'

import { useAppointments } from '@/store/appointments'
import { useCheckins } from '@/store/checkins'
import { useFamily } from '@/store/family'
import { usePatient } from '@/store/patient'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'

/**
 * Bridges Clerk (Google / email) into BayouCare's existing session store.
 * Demo email+password login via /api/login still works side-by-side.
 */
export function ClerkSessionSync() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const auth = useSession((s) => s.auth)
  const email = useSession((s) => s.email)
  const entering = useRef(false)
  const prevAuth = useRef(auth)

  // When Clerk says signed-in, enter as a fresh (or restored) self chart.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    const clerkEmail =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      ''
    // Username-only Clerk accounts have no email — still need a stable key.
    const accountKey = clerkEmail || (user.username ? `user:${user.username}` : `clerk:${user.id}`)
    if (!accountKey) return

    if (auth === 'in' && email.toLowerCase() === accountKey.toLowerCase()) return
    if (entering.current) return
    entering.current = true

    void (async () => {
      try {
        useUi.getState().setMode('patient')
        useUi.getState().setLoginOpen(false)

        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.fullName?.trim() ||
          user.username ||
          clerkEmail.split('@')[0] ||
          ''

        usePatient.getState().beginSelfSession({
          email: accountKey,
          name: displayName,
          username: user.username,
        })

        // Empty appointments / check-ins / vitals — no Darlene demo bleed.
        useAppointments.setState((s) => ({
          plans: { ...s.plans, self: s.plans.self ?? [] },
        }))
        useCheckins.getState().resetForPatient('self')
        useVitals.getState().resetForPatient('self')
        useFamily.getState().reset('self')

        useSession.setState({
          auth: 'in',
          role: 'patient',
          email: accountKey,
          errorKey: null,
          busy: false,
          bootFault: null,
        })
      } finally {
        entering.current = false
      }
    })()
  }, [isLoaded, isSignedIn, user, auth, email])

  // Only clear Clerk after an explicit app sign-out (in → out), not on boot.
  useEffect(() => {
    const wasIn = prevAuth.current === 'in'
    prevAuth.current = auth
    if (!isLoaded) return
    if (wasIn && auth === 'out' && isSignedIn) {
      void signOut({ redirectUrl: window.location.href })
    }
  }, [auth, isLoaded, isSignedIn, signOut])

  return null
}

export function clerkEnabled() {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
}
