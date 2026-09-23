import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'

import { SigningInStage } from '@/components/auth/SigningInStage'
import { Input } from '@/components/motion/input'
import { ThemeModeControl } from '@/components/shared/ThemeModeControl'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { LANG_TOAST } from '@/data'
import { LANGS, LANG_LABELS, LANG_SHORT, type Lang } from '@/lib/i18n'
import { duration, EASE_OUT } from '@/lib/motion'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

type AuthMode = 'signin' | 'signup'

/**
 * Sign-in / sign-up form — used inside the center-morph modal and /login.
 * Prefills from `loginPrefill` when opened from the demo carousel page.
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
  const lang = useUi((s) => s.lang)
  const setLang = useUi((s) => s.setLang)
  const setLoginOpen = useUi((s) => s.setLoginOpen)
  const loginPrefill = useUi((s) => s.loginPrefill)
  const clearLoginPrefill = useUi((s) => s.clearLoginPrefill)

  const [mode, setMode] = useState<AuthMode>('signin')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showStage, setShowStage] = useState(false)
  const [phase, setPhase] = useState<'auth' | 'record'>('auth')
  const [signupBusy, setSignupBusy] = useState(false)

  useEffect(() => {
    if (!loginPrefill) return
    setMode('signin')
    setEmail(loginPrefill.email)
    setPassword(loginPrefill.password)
    clearLoginPrefill()
  }, [loginPrefill, clearLoginPrefill])

  useEffect(() => {
    if (busy) {
      setShowStage(true)
      setPhase('auth')
      const id = window.setTimeout(() => setPhase('record'), 900)
      return () => window.clearTimeout(id)
    }
    if (errorKey) {
      setShowStage(false)
      setPhase('auth')
    }
  }, [busy, errorKey])

  function switchMode(next: AuthMode) {
    setMode(next)
    useSession.setState({ errorKey: null })
    setShowPass(false)
  }

  function submit(e: FormEvent) {
    e.preventDefault()

    if (mode === 'signup') {
      if (!username.trim() || !email.trim() || !password) {
        useSession.setState({ errorKey: 'login.missing' })
        return
      }
      setSignupBusy(true)
      window.setTimeout(() => {
        setSignupBusy(false)
        toast.success(t('login.signupThanks'), {
          description: t('login.signupThanksDetail'),
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

  const isSignup = mode === 'signup'
  const formBusy = busy || signupBusy
  const stageTitle = phase === 'record' ? t('login.openingRecord') : t('login.signingIn')
  const stageDetail =
    phase === 'record' ? t('login.openingRecordDetail') : t('login.signingInDetail')

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {showStage ? (
          <SigningInStage key="signing" title={stageTitle} detail={stageDetail} />
        ) : (
          <motion.form
            key={mode}
            onSubmit={submit}
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
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {isSignup ? t('login.signupTitle') : t('login.title')}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {isSignup ? t('login.signupSub') : t('login.sub')}
                </p>
              </div>
            </div>

            <div className="mb-4 flex justify-end">
              <label className="sr-only" htmlFor="bc-login-lang">
                Language
              </label>
              <select
                id="bc-login-lang"
                value={lang}
                onChange={(e) => {
                  const next = e.target.value as Lang
                  setLang(next)
                  toast(LANG_TOAST[next] ?? LANG_TOAST.en)
                }}
                className="h-9 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground"
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {LANG_SHORT[l]} · {LANG_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3">
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
                id="bc-password"
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
            </div>

            <button
              type="submit"
              disabled={formBusy}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 disabled:opacity-60 motion-safe:active:scale-[0.98]"
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
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
