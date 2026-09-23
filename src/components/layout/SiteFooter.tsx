import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Leaf, Mail } from 'lucide-react'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { scrollWindowToTop } from '@/components/layout/ScrollToTop'
import { useT } from '@/hooks/useT'
import { useSession } from '@/store/session'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

type FooterLink = { label: string; to?: string; onClick?: () => void }

/**
 * Aceternity-style “Footer With Big Text” adapted for BayouCare.
 * All-access registry blocks require auth; this follows their documented layout:
 * link columns + social row + oversized pulsing brand with gradient fade.
 */
export function SiteFooter({
  variant = 'app',
  className,
}: {
  variant?: 'app' | 'public'
  className?: string
}) {
  const t = useT()
  const role = useSession((s) => s.role)
  const setLoginOpen = useUi((s) => s.setLoginOpen)
  const year = new Date().getFullYear()
  const reduceMotion = useReducedMotion()

  const careLinks: FooterLink[] =
    variant === 'public'
      ? [
          { label: t('landing.ctaDemo'), to: '/demo' },
          { label: t('landing.signIn'), onClick: () => setLoginOpen(true) },
          { label: t('landing.aboutHead'), to: '/' },
        ]
      : [
          { label: t('nav.overview'), to: '/overview' },
          { label: t('nav.app'), to: '/my-care/home' },
          { label: t('nav.myplan'), to: '/my-plan' },
          { label: t('side.remi'), to: '/my-care/remi' },
        ]

  const toolsLinks: FooterLink[] =
    variant === 'public'
      ? [
          { label: t('landing.whyHead'), to: '/' },
          { label: t('landing.journeyHead'), to: '/' },
          { label: t('landing.winsHead'), to: '/' },
        ]
      : role === 'clinician'
        ? [
            { label: t('nav.team'), to: '/care-team' },
            { label: t('nav.clinicops'), to: '/clinic-ops' },
            { label: t('nav.surv'), to: '/survivorship' },
            { label: t('nav.pop'), to: '/population' },
            { label: t('nav.roadmap'), to: '/roadmap' },
          ]
        : [
            { label: t('side.calendar'), to: '/my-care/calendar' },
            { label: t('side.checkins'), to: '/my-care/checkins' },
            { label: t('side.messages'), to: '/my-care/messages' },
            { label: t('side.access'), to: '/my-care/access' },
          ]

  const eventLinks: FooterLink[] = [
    { label: t('footer.devdays'), to: variant === 'public' ? '/' : '/overview' },
    { label: t('footer.louisiana'), to: variant === 'public' ? '/' : '/my-care/access' },
    { label: t('footer.notAdvice'), to: variant === 'public' ? '/' : '/my-care/remi' },
  ]

  const columns = [
    { title: t('footer.care'), links: careLinks },
    { title: t('footer.tools'), links: toolsLinks },
    { title: t('footer.event'), links: eventLinks },
  ]

  return (
    <footer
      className={cn(
        'relative overflow-hidden border-t border-border bg-muted/30 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 dark:bg-zinc-950/40',
        className,
      )}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-7 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <BrandLogo size="sm" className="mb-3" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t('footer.tagline')}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="mailto:hello@bayoucare.demo"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand-500/40 hover:text-foreground"
                aria-label="Email BayouCare"
              >
                <Mail className="size-4" aria-hidden="true" />
              </a>
              <span className="inline-flex size-9 items-center justify-center rounded-full border border-border text-brand-600 dark:text-brand-400">
                <Leaf className="size-4" aria-hidden="true" />
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-1">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        onClick={scrollWindowToTop}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={link.onClick}
                        className="text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="sm:col-span-2 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('footer.noteHead')}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t('footer.noteBody')}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} BayouCare · {t('footer.devdays')}
          </p>
          <p className="text-xs text-muted-foreground">{t('footer.made')}</p>
        </div>
      </div>

      <div className="pointer-events-none relative mt-6 select-none" aria-hidden="true">
        <motion.p
          className="bg-gradient-to-b from-foreground/25 to-foreground/5 bg-clip-text text-center font-display text-[4.5rem] font-semibold leading-none tracking-tighter text-transparent sm:text-[8rem] md:text-[12rem] lg:text-[16rem]"
          animate={reduceMotion ? undefined : { opacity: [0.55, 0.9, 0.55] }}
          transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          BayouCare
        </motion.p>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent dark:from-background" />
      </div>
    </footer>
  )
}
