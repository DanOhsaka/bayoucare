import { useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { PublicHeader } from '@/components/layout/PublicHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CylinderCarousel } from '@/components/motion/cylinder-carousel'
import {
  ShaderBackground,
  type ShaderBackgroundVariant,
} from '@/components/motion/shader-background'
import { Tabs, TabsList, TabsTrigger } from '@/components/motion/tabs'
import { Button } from '@/components/ui/button'
import { DEMO_ACCOUNTS, type DemoAccount } from '@/data/demoAccounts'
import { useUi } from '@/store/ui'

/**
 * Each variant has its own prop shape; slides only spread their own preset.
 * Same cast pattern as https://beui.dev/components/motion/cylinder-carousel
 */
const Background = ShaderBackground as ComponentType<
  {
    variant: ShaderBackgroundVariant
    className?: string
    style?: CSSProperties
    width?: number | string
    height?: number | string
  } & Record<string, unknown>
>

/** Bright CSS face so an orb never reads as a blank disc if WebGL lags. */
function faceFallback(account: DemoAccount): string {
  switch (account.shader.variant) {
    case 'dithering':
      return [
        'radial-gradient(circle at 50% 55%, #b98cff 0%, #b98cff 28%, transparent 42%)',
        'radial-gradient(circle at 50% 50%, #2a1848 0%, #1a1030 100%)',
      ].join(', ')
    case 'metaballs':
      return [
        'radial-gradient(circle at 45% 42%, #f5f5f7 0%, #9a9aaa 38%, transparent 52%)',
        'radial-gradient(circle at 58% 58%, #6a6a78 0%, transparent 40%)',
        'linear-gradient(145deg, #d8cfc4 0%, #c9b9a8 100%)',
      ].join(', ')
    case 'warp':
      return 'repeating-conic-gradient(from 20deg at 50% 50%, #c8ff00 0deg 14deg, #3a5a00 14deg 28deg)'
    case 'god-rays':
      return 'repeating-conic-gradient(from -10deg at 50% 18%, #6a7bff 0deg 10deg, #00114d 10deg 20deg)'
    case 'swirl':
      return 'conic-gradient(from 200deg at 50% 50%, #ffd1a8, #ff6a3d, #b31a57, #1a0000, #ffd1a8)'
    default: {
      const colors = (account.shader.props.colors as string[] | undefined) ?? [
        '#34d399',
        '#064e3b',
      ]
      return `radial-gradient(circle at 35% 30%, ${colors[0]} 0%, ${colors[1] ?? colors[0]} 100%)`
    }
  }
}

/**
 * Demo accounts — beUI CylinderCarousel motion + gallery shader faces.
 */
export function DemoAccountsPage() {
  const openLoginWithCredentials = useUi((s) => s.openLoginWithCredentials)
  const [index, setIndex] = useState(0)
  const [variant, setVariant] = useState<'concave' | 'convex'>('concave')
  const press = useRef<{ x: number; y: number; id: string } | null>(null)

  const active = DEMO_ACCOUNTS[index] ?? DEMO_ACCOUNTS[0]

  function openAccount(account: DemoAccount) {
    openLoginWithCredentials(account.email, account.pass)
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      {/* CSS-only wash — avoid an extra WebGL context competing with the orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(29,184,127,0.18),_transparent_55%),linear-gradient(180deg,#0b1220_0%,#05080f_100%)]"
      />

      <PublicHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-3 py-8 sm:px-5 sm:py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to BayouCare
        </Link>

        <div className="mb-8 max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Demo accounts
          </p>
          <h1 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Pick who you are walking with
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Drag, scroll, or use arrow keys to roll the cylinder. Click a profile — or confirm
            below — to open sign-in with that demo account filled in.
          </p>
        </div>

        <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl border border-border bg-card/80 p-5 shadow-[var(--shadow)] backdrop-blur-md sm:p-8">
          <Tabs
            value={variant}
            onValueChange={(v) => setVariant(v as 'concave' | 'convex')}
            variant="segment"
          >
            <TabsList>
              <TabsTrigger value="concave">Concave</TabsTrigger>
              <TabsTrigger value="convex">Convex</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* clip-path (not overflow) so rounded corners also clip GPU-composited balls */}
          <div className="w-full rounded-3xl border border-border/60 bg-muted/30 py-6 [clip-path:inset(0_round_1.5rem)]">
            <CylinderCarousel
              variant={variant}
              itemSize={230}
              height={310}
              visibleItems={5}
              defaultIndex={0}
              onIndexChange={setIndex}
              className="w-full"
            >
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  title={account.name}
                  aria-label={`Sign in as ${account.name}`}
                  className="relative h-full w-full overflow-hidden rounded-full border border-white/25 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{
                    boxShadow: `0 18px 36px -10px ${account.glow}`,
                    backgroundImage: faceFallback(account),
                    backgroundColor: '#1a1a22',
                  }}
                  onPointerDown={(e) => {
                    press.current = { x: e.clientX, y: e.clientY, id: account.id }
                  }}
                  onPointerUp={(e) => {
                    const start = press.current
                    press.current = null
                    if (!start || start.id !== account.id) return
                    const dx = Math.abs(e.clientX - start.x)
                    const dy = Math.abs(e.clientY - start.y)
                    if (dx < 8 && dy < 8) openAccount(account)
                  }}
                  onPointerCancel={() => {
                    press.current = null
                  }}
                >
                  <Background
                    variant={account.shader.variant}
                    className="absolute inset-0 h-full w-full"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    {...account.shader.props}
                  />
                </button>
              ))}
            </CylinderCarousel>
          </div>

          <p className="text-xs text-muted-foreground">Drag, scroll or use arrow keys to roll</p>

          <div className="mt-2 flex flex-col items-center gap-2 text-center">
            <p className="text-lg font-semibold text-foreground">{active.name}</p>
            <p className="text-sm text-muted-foreground">{active.role}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{active.email}</p>
            <Button
              type="button"
              size="lg"
              className="mt-2 font-semibold"
              onClick={() => openAccount(active)}
            >
              Sign in as {active.name}
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter variant="public" className="relative z-10" />
    </div>
  )
}
