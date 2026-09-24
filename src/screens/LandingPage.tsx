import { useNavigate } from 'react-router-dom'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Stagger, StaggerItem } from '@/components/shared/Motion'
import { AnimatedBadge } from '@/components/motion/animated-badge'
import { Button } from '@/components/motion/button/base'
import { ChromaticTextReveal } from '@/components/motion/chromatic-text-reveal'
import { NumberTicker } from '@/components/motion/number-ticker'
import { ShaderBackground } from '@/components/motion/shader-background'
import { TextReveal } from '@/components/motion/text-reveal'
import { TextShimmer } from '@/components/motion/text-shimmer'
import { TiltCard } from '@/components/motion/tilt-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { TracingBeam } from '@/components/ui/tracing-beam'
import { SiteFooter } from '@/components/layout/SiteFooter'
import {
  MARKETING_JOURNEY,
  MARKETING_STATS,
  MARKETING_TOOLS,
  MARKETING_WHY,
  MARKETING_WINS,
  TAG_BADGE,
} from '@/content/marketing'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5 mt-12 flex flex-col gap-1 sm:mt-14">
      <TextReveal
        text={title}
        as="h2"
        className="text-2xl font-semibold tracking-tight text-foreground font-display sm:text-3xl"
        whileInView
      />
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  )
}

/**
 * Public About / landing — beUI motion + theme tokens.
 */
export function LandingPage() {
  const t = useT()
  const navigate = useNavigate()
  const setLoginOpen = useUi((s) => s.setLoginOpen)
  const h1 = t('hero.h1')
  // hero.h1 is HTML with a <span class="hi"> second line — split for motion.
  const plain = h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const [line1, ...rest] = plain.split(/(?=BayouCare)/)
  const line2 = rest.join('').trim() || 'BayouCare walks it with you.'

  const openLogin = () => setLoginOpen(true)

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-70 dark:opacity-50">
        <ShaderBackground
          variant="mesh-gradient"
          colors={['#0f6b4c', '#1db87f', '#e8a317', '#0a3d2b']}
          speed={0.35}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
      </div>

      <PublicHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-5 sm:py-10">
        <TracingBeam className="max-w-none">
        <section className="relative overflow-hidden rounded-3xl border border-border glass px-5 py-10 sm:px-10 sm:py-14">
          <AnimatedBadge
            className="mb-5 border-border bg-background/60 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t('hero.kicker')}
          </AnimatedBadge>

          <TextReveal
            text={line1.trim()}
            as="h1"
            className="block text-3xl font-semibold leading-[1.1] tracking-tight text-foreground font-display sm:text-4xl md:text-5xl"
            stagger={0.05}
          />
          <ChromaticTextReveal
            prefix=""
            words={[line2, 'Care that walks with you.', 'One plan. Every parish.']}
            colors={['#1db87f', '#34d399', '#e8a317', '#60a5fa']}
            foregroundColor="var(--primary)"
            className="mt-2 block text-3xl font-semibold leading-[1.1] tracking-tight font-display sm:text-4xl md:text-5xl"
            loop
            duration={1.35}
            retractDuration={0.85}
            pauseDuration={1.4}
            delay={0.05}
          />

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('hero.lead')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="font-semibold"
              onClick={() => navigate('/demo')}
            >
              {t('landing.ctaDemo')}
            </Button>
            <Button type="button" variant="outline" size="lg" className="font-semibold" onClick={openLogin}>
              {t('landing.ctaSignIn')}
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t('landing.haveAccount')}</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETING_STATS.map((s) => {
              const n = Number(String(s.n).replace(/,/g, ''))
              return (
                <TiltCard key={s.key} className="rounded-2xl border border-border bg-card/80 p-4">
                  <div className="text-2xl font-semibold tracking-tight text-foreground">
                    {Number.isFinite(n) ? (
                      <NumberTicker value={n} locale className="tabular-nums" />
                    ) : (
                      s.n
                    )}{' '}
                    <small className="text-sm font-medium text-muted-foreground">{s.small}</small>
                  </div>
                  <div className="mt-1 text-xs leading-snug text-muted-foreground">{t(s.key)}</div>
                </TiltCard>
              )
            })}
          </div>
        </section>

        <SectionTitle title={t('landing.aboutHead')} sub={t('landing.aboutSub')} />
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {t('landing.aboutBody')}
        </p>

        <SectionTitle title={t('landing.whyHead')} sub={t('landing.whySub')} />
        <Stagger animateOnMount className="grid gap-4 md:grid-cols-3">
          {MARKETING_WHY.map((c) => (
            <StaggerItem key={c.h}>
              <TiltCard>
                <Card className="h-full border-0 shadow-none">
                  <CardContent>
                    <Badge variant={TAG_BADGE[c.tag]} className="uppercase tracking-[0.05em]">
                      {c.tagLabel}
                    </Badge>
                    <CardTitle className="mt-3">{c.h}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{c.p}</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>

        <SectionTitle title={t('landing.journeyHead')} sub={t('landing.journeySub')} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETING_JOURNEY.map(([n, l]) => (
            <div key={n} className="rounded-2xl border border-border bg-muted/40 p-3.5">
              <div className="font-mono text-xs font-medium text-primary">{n}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground">{l}</div>
            </div>
          ))}
        </div>

        <Stagger animateOnMount className="mt-4 grid gap-4 md:grid-cols-2">
          {MARKETING_TOOLS.map(({ icon: Icon, h, p }) => (
            <StaggerItem key={h}>
              <Card>
                <CardContent>
                  <div className="flex gap-3">
                    <span
                      className="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-card-foreground">{h}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <blockquote className="glass mt-12 rounded-2xl border-l-4 border-primary p-6 text-base text-card-foreground">
          <TextShimmer as="span" className="italic">
            {t('landing.quote')}
          </TextShimmer>
          <span className="mt-3 block text-xs font-medium not-italic text-muted-foreground">
            {t('landing.quoteAttr')}
          </span>
        </blockquote>

        <SectionTitle title={t('landing.winsHead')} sub={t('landing.winsSub')} />
        <div className="grid gap-4 md:grid-cols-3">
          {MARKETING_WINS.map(({ icon: Icon, h, p }) => (
            <TiltCard key={h}>
              <Card className="h-full border-0 shadow-none">
                <CardContent>
                  <div className="flex gap-3">
                    <span
                      className="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-card-foreground">{h}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          ))}
        </div>

        <section
          id="get-started"
          className="glass mt-14 rounded-3xl border border-border p-6 sm:p-8"
        >
          <TextReveal
            text={t('landing.getStartedHead')}
            as="h2"
            className="text-xl font-semibold tracking-tight text-foreground font-display sm:text-2xl"
            whileInView
          />
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t('landing.getStartedBody')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="font-semibold"
              onClick={() => navigate('/demo')}
            >
              {t('landing.ctaDemo')}
            </Button>
            <Button type="button" variant="outline" size="lg" className="font-semibold" onClick={openLogin}>
              {t('landing.ctaSignIn')}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t('landing.demoNote')}</p>
        </section>
        </TracingBeam>
      </main>

      <SiteFooter variant="public" className="relative z-10" />
    </div>
  )
}
