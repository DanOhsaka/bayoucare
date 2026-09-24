import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SignInButton, SignUpButton } from '@clerk/react'
import { useSignIn } from '@clerk/react/legacy'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'

import { clerkEnabled } from '@/components/auth/ClerkSessionSync'
import { SigningInStage } from '@/components/auth/SigningInStage'
import { Input } from '@/components/motion/input'
import { LanguageSelect } from '@/components/shared/LanguageSelect'
import { ThemeModeControl } from '@/components/shared/ThemeModeControl'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { duration, EASE_OUT } from '@/lib/motion'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

type AuthMode = 'signin' | 'signup'

function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const first = (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]
    return first?.longMessage || first?.message || ''
  }
  if (err instanceof Error) return err.message
  return ''
}

/** Real-account fields — only mounted under ClerkProvider. */
function ClerkAccountForm({
  onBusy,
}: {
  onBusy: (busy: boolean) => void
}) {
  const t = useT()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    onBusy(busy)
  }, [busy, onBusy])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const id = identifier.trim()
    if (!id || !password) {
      setError('Enter your email or username and password.')
      return
    }
    if (!isLoaded || !signIn || !setActive) {
      setError('Sign-in is still loading — try again in a moment.')
      return
    }

    setBusy(true)
    try {
      const result = await signIn.create({
        identifier: id,
        password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        return
      }

      setError(
        'Extra verification is required. Use Continue with Google, or finish in the Clerk window.',
      )
      toast.message('Almost signed in', {
        description: 'Open Continue with Google if Clerk asks for another step.',
      })
    } catch (err) {
      setError(
        clerkErrorMessage(err) ||
          'Those credentials were not recognized. Check email/username and password.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <SignInButton mode="modal">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 motion-safe:active:scale-[0.98]"
          >
            Continue with Google
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70"
          >
            Create account
          </button>
        </SignUpButton>
      </div>

      <form className="flex flex-col gap-3" onSubmit={(e) => void submit(e)}>
        <Input
          id="bc-identifier"
          label="Email or username"
          type="text"
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="you@example.com or your username"
          value={identifier}
          onChange={setIdentifier}
          leftIcon={<User className="size-4" aria-hidden="true" />}
          error={error && !identifier.trim() ? true : false}
        />

        <Input
          id="bc-password"
          label={t('login.password')}
          type={showPass ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          leftIcon={<Lock className="size-4" aria-hidden="true" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          }
          error={error || false}
          reserveErrorLine
        />

        <button
          type="submit"
          disabled={busy || !isLoaded}
          className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 disabled:opacity-60 motion-safe:active:scale-[0.98]"
        >
          {busy ? '…' : 'Sign in to my account'}
        </button>
      </form>
    </>
  )
}

function DemoAccountForm() {
  const t = useT()
  const login = useSession((s) => s.login)
  const busy = useSession((s) => s.busy)
  const errorKey = useSession((s) => s.errorKey)
  const loginPrefill = useUi((s) => s.loginPrefill)
  const clearLoginPrefill = useUi((s) => s.clearLoginPrefill)

  const [demoEmail, setDemoEmail] = useState('')
  const [demoPassword, setDemoPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (!loginPrefill) return
    setDemoEmail(loginPrefill.email)
    setDemoPassword(loginPrefill.password)
    clearLoginPrefill()
  }, [loginPrefill, clearLoginPrefill])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!demoEmail || !demoPassword) {
      useSession.setState({ errorKey: 'login.missing' })
      return
    }
    void login(demoEmail, demoPassword)
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Input
        id="bc-demo-email"
        label="Demo email"
        type="email"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        placeholder="patient@bayoucare.demo"
        value={demoEmail}
        onChange={setDemoEmail}
        leftIcon={<Mail className="size-4" aria-hidden="true" />}
        error={errorKey === 'login.missing' && !demoEmail ? true : false}
      />

      <Input
        id="bc-demo-password"
        label="Demo password"
        type={showPass ? 'text' : 'password'}
        autoComplete="off"
        placeholder="••••••••"
        value={demoPassword}
        onChange={setDemoPassword}
        leftIcon={<Lock className="size-4" aria-hidden="true" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        }
        error={
          errorKey && errorKey !== 'login.missing'
            ? t(errorKey)
            : errorKey === 'login.missing' && !demoPassword
              ? true
              : false
        }
        reserveErrorLine
      />

      <button
        type="submit"
        disabled={busy}
        className="mt-1 flex h-12 w-full items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-60 motion-safe:active:scale-[0.98]"
      >
        {busy ? '…' : 'Sign in with demo account'}
      </button>
    </form>
  )
}

/**
 * Sign-in / sign-up form — used inside the center-morph modal and /login.
 *
 * With Clerk enabled: real email/username + password go through Clerk.
 * Demo Neon accounts stay in a separate section below.
 */
export function LoginForm({
  className,
  showBack = false,
}: {
  className?: string
  showBack?: boolean
}) {
  const t = useT()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const login = useSession((s) => s.login)
  const busy = useSession((s) => s.busy)
  const errorKey = useSession((s) => s.errorKey)
  const setLoginOpen = useUi((s) => s.setLoginOpen)
  const loginPrefill = useUi((s) => s.loginPrefill)
  const clearLoginPrefill = useUi((s) => s.clearLoginPrefill)
  const hasClerk = clerkEnabled()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showStage, setShowStage] = useState(false)
  const [phase, setPhase] = useState<'auth' | 'record'>('auth')
  const [signupBusy, setSignupBusy] = useState(false)
  const [clerkBusy, setClerkBusy] = useState(false)

  useEffect(() => {
    if (hasClerk) setMode('signin')
  }, [hasClerk])

  useEffect(() => {
    if (!loginPrefill || hasClerk) return
    setMode('signin')
    setEmail(loginPrefill.email)
    setPassword(loginPrefill.password)
    clearLoginPrefill()
  }, [loginPrefill, clearLoginPrefill, hasClerk])

  useEffect(() => {
    if (busy || clerkBusy || signupBusy) {
      setShowStage(true)
      setPhase('auth')
      const id = window.setTimeout(() => setPhase('record'), 900)
      return () => window.clearTimeout(id)
    }
    if (errorKey) {
      setShowStage(false)
      setPhase('auth')
    }
  }, [busy, clerkBusy, signupBusy, errorKey])

  function switchMode(next: AuthMode) {
    if (hasClerk && next === 'signup') return
    setMode(next)
    useSession.setState({ errorKey: null })
    setShowPass(false)
  }

  function submitLegacy(e: FormEvent) {
    e.preventDefault()

    if (mode === 'signup') {
      if (!username.trim() || !email.trim() || !password) {
        useSession.setState({ errorKey: 'login.missing' })
        return
      }
      setSignupBusy(true)
      window.setTimeout(() => {
        setSignupBusy(false)
        toast.message('Real signup needs Clerk', {
          description:
            'Add VITE_CLERK_PUBLISHABLE_KEY to .env.local (Clerk → API Keys), restart npm run dev, then create an account.',
        })
        setMode('signin')
        setPassword('')
        useSession.setState({ errorKey: null })
      }, 700)
      return
    }

    if (!email || !password) {
      useSession.setState({ errorKey: 'login.missing' })
      return
    }
    void login(email, password)
  }

  const isSignup = !hasClerk && mode === 'signup'
  const formBusy = busy || signupBusy || clerkBusy
  const stageTitle = phase === 'record' ? t('login.openingRecord') : t('login.signingIn')
  const stageDetail =
    phase === 'record' ? t('login.openingRecordDetail') : t('login.signingInDetail')

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {showStage ? (
          <SigningInStage key="signing" title={stageTitle} detail={stageDetail} />
        ) : (
          <motion.div
            key={hasClerk ? 'clerk-signin' : mode}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0.01 : duration.normal, ease: EASE_OUT }}
            className="p-6 text-card-foreground sm:p-8"
          >
            <div
              className={cn(
                'mb-5 flex items-center gap-3',
                showBack ? 'justify-between' : 'justify-end pr-8',
              )}
            >
              {showBack ? (
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  {t('login.back')}
                </Link>
              ) : null}
              <ThemeModeControl />
            </div>

            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <BrandLogo size="lg" className="mx-auto" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">
                  {isSignup ? t('login.signupTitle') : t('login.title')}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {hasClerk
                    ? 'Sign in with Google, or your email / username and password.'
                    : isSignup
                      ? t('login.signupSub')
                      : t('login.sub')}
                </p>
              </div>
            </div>

            <div className="mb-4 flex justify-end">
              <LanguageSelect className="w-auto min-w-[10.5rem]" />
            </div>

            {hasClerk ? (
              <>
                <ClerkAccountForm onBusy={setClerkBusy} />

                <div className="relative my-5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
                  <span className="relative bg-card px-2">demo accounts only</span>
                </div>

                <DemoAccountForm />

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  New here?{' '}
                  <SignUpButton mode="modal">
                    <button type="button" className="font-semibold text-primary hover:underline">
                      Create a real account
                    </button>
                  </SignUpButton>
                </p>
              </>
            ) : (
              <form className="flex flex-col gap-3" onSubmit={submitLegacy}>
                {isSignup ? (
                  <Input
                    id="bc-username"
                    label={t('login.username')}
                    type="text"
                    autoComplete="username"
                    spellCheck={false}
                    autoCapitalize="words"
                    placeholder={t('login.usernamePlaceholder')}
                    value={username}
                    onChange={setUsername}
                    leftIcon={<User className="size-4" aria-hidden="true" />}
                    error={errorKey === 'login.missing' && !username.trim() ? true : false}
                  />
                ) : null}

                <Input
                  id="bc-email"
                  label={t('login.email')}
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  leftIcon={<Mail className="size-4" aria-hidden="true" />}
                  error={errorKey === 'login.missing' && !email ? true : false}
                />

                <Input
                  id="bc-password-legacy"
                  label={t('login.password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  leftIcon={<Lock className="size-4" aria-hidden="true" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  }
                  error={
                    errorKey && errorKey !== 'login.missing'
                      ? t(errorKey)
                      : errorKey === 'login.missing' && !password
                        ? true
                        : false
                  }
                  reserveErrorLine
                />

                <button
                  type="submit"
                  disabled={formBusy}
                  className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-60 motion-safe:active:scale-[0.98]"
                >
                  {formBusy ? '…' : isSignup ? t('login.signupSubmit') : t('login.submit')}
                </button>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  {isSignup ? (
                    <>
                      {t('login.haveAccountPrompt')}{' '}
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => switchMode('signin')}
                      >
                        {t('login.signInLink')}
                      </button>
                    </>
                  ) : (
                    <>
                      {t('login.noAccount')}{' '}
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => switchMode('signup')}
                      >
                        {t('login.signUp')}
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t('login.demoCarouselHint')}{' '}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setLoginOpen(false)
                  navigate('/demo')
                }}
              >
                {t('login.demoCarouselLink')}
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
