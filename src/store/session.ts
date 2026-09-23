import { create } from 'zustand'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'

export type AuthState = 'pending' | 'out' | 'in'
export type Role = 'patient' | 'clinician'

interface SessionState {
  auth: AuthState
  role: Role
  email: string
  /** i18n key, not a sentence — the gate renders it in the active language. */
  errorKey: string | null
  busy: boolean
  /** Session boot failure — API 5xx on /api/session. Not ordinary logged-out. */
  bootFault: null | 'server'
  check: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const isClinician = (role: unknown): boolean => role === 'clinician'

/**
 * Bind UI mode + patient record WITHOUT flipping `auth` to `in`.
 *
 * Login holds `auth: 'out'` until the signing-in stage has had time to play;
 * cold session check commits immediately via `enter()`.
 */
async function prepareSession(me: { email: string; role: string }) {
  const clinician = isClinician(me.role)
  useUi.getState().setMode(clinician ? 'admin' : 'patient')

  // Bound BEFORE flipping to 'in'. The legacy file does the same, and the
  // ordering matters: flipping first would paint the previous patient's record
  // for a frame before the correct one arrives.
  if (!clinician) {
    await usePatient.getState().loadFromServer()
  }

  return {
    role: (clinician ? 'clinician' : 'patient') as Role,
    email: me.email,
  }
}

/** Shared tail of both sign-in paths: prepare, then commit auth. */
async function enter(set: (p: Partial<SessionState>) => void, me: { email: string; role: string }) {
  const prepared = await prepareSession(me)
  set({ auth: 'in', role: prepared.role, email: prepared.email, errorKey: null })
}

export const useSession = create<SessionState>((set) => ({
  auth: 'pending',
  role: 'patient',
  email: '',
  errorKey: null,
  busy: false,
  bootFault: null,

  /**
   * GET /api/session on load.
   *
   * `pending` is the initial state and renders NOTHING at all — neither the
   * gate nor the app. That is deliberate and comes straight from the legacy
   * app: rendering the app and then covering it would flash a patient's record
   * at whoever is signing in.
   *
   * Fails closed on every path that is not an explicit 200.
   * 5xx / network → bootFault (fault page). 401/403 → logged out, no fault.
   */
  async check() {
    try {
      const res = await fetch('/api/session', { cache: 'no-store' })
      if (res.ok) {
        await enter(set, (await res.json()) as { email: string; role: string })
        set({ bootFault: null })
        return
      }
      if (res.status >= 500) {
        set({ auth: 'out', bootFault: 'server' })
        return
      }
      set({ auth: 'out', bootFault: null })
    } catch {
      // Unreachable API (vite without backend, file://, offline) → logged out,
      // not the fault page. 5xx above is the server-fault path.
      set({ auth: 'out', bootFault: null })
    }
  },

  async login(email, password) {
    set({ busy: true, errorKey: null })
    const started = Date.now()
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const me = (await res.json()) as { email: string; role: string }
        const prepared = await prepareSession(me)
        // Keep the signing-in stage up long enough to feel intentional on a warm API.
        const hold = Math.max(0, 1100 - (Date.now() - started))
        if (hold) await new Promise((r) => setTimeout(r, hold))
        set({
          auth: 'in',
          role: prepared.role,
          email: prepared.email,
          errorKey: null,
          busy: false,
        })
        return
      }

      // 429 is distinguished from a bad password so the gate can tell someone
      // to wait rather than implying they mistyped.
      set({ busy: false, errorKey: res.status === 429 ? 'login.throttled' : 'login.bad' })
    } catch {
      set({ busy: false, errorKey: 'login.offline' })
    }
  },

  /**
   * POST /api/logout, then clear every store.
   *
   * The legacy app finished with `location.reload()` because a user switch had
   * to invalidate a dozen module-scope holdovers that were never built to be
   * cleared. With stores that is unnecessary — but a reset is only as complete
   * as the number of stores it names, so every new store MUST be added to
   * `resetStores()` in src/store/index.ts when it is created. The reload was
   * provably complete; a reset has to be maintained. That trade is worth it,
   * but only if the list stays current.
   */
  async logout() {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch {
      /* sign out locally regardless — the cookie will expire on its own */
    }
    const { resetStores } = await import('@/store/index')
    resetStores()
    set({ auth: 'out', role: 'patient', email: '', errorKey: null, busy: false, bootFault: null })
  },
}))
