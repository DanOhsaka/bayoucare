import { useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { PublicHeader } from '@/components/layout/PublicHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CylinderCarousel } from '@/components/motion/cylinder-carousel'
import { ShaderBackground } from '@/components/motion/shader-background'
import { Button } from '@/components/ui/button'
import { DEMO_ACCOUNTS } from '@/data/demoAccounts'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * Full-page beUI-style cylinder carousel of demo accounts.
 * Click / confirm opens the sign-in morph with credentials filled.
 */
export function DemoAccountsPage() {
  const openLoginWithCredentials = useUi((s) => s.openLoginWithCredentials)
  const [index, setIndex] = useState(0)
  const press = useRef<{ x: number; y: number; id: string } | null>(null)

  const active = DEMO_ACCOUNTS[index] ?? DEMO_ACCOUNTS[0]

  function openAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
    openLoginWithCredentials(account.email, account.pass)
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-45">
        <ShaderBackground
          variant="mesh-gradient"
          colors={['#0f6b4c', '#1db87f', '#0a3d2b', '#111827']}
          speed={0.25}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

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
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground font-display sm:text-4xl">
            Pick who you are walking with
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Drag, scroll, or use arrow keys to roll the cylinder. Click a profile — or
            confirm below — to open sign-in with that demo account filled in.
          </p>
        </div>

        <div className="w-full max-w-3xl rounded-3xl border border-border bg-card/80 p-5 shadow-[var(--shadow)] backdrop-blur-md sm:p-10">
          <CylinderCarousel
            variant="concave"
            itemSize={200}
            visibleItems={5}
            height={250}
            defaultIndex={0}
            onIndexChange={setIndex}
            className="mx-auto"
          >
            {DEMO_ACCOUNTS.map((account, i) => {
              const activeOrb = i === index
              const Shader = ShaderBackground as ComponentType<
                { variant: string; className?: string } & Record<string, unknown>
              >
              return (
              <button
                key={account.id}
                type="button"
                title={account.name}
                aria-label={`Sign in as ${account.name}`}
                className={cn(
                  'group relative size-full overflow-hidden rounded-full',
                  'outline-none transition-[transform,filter] duration-200 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'motion-safe:hover:scale-[1.04] motion-safe:hover:brightness-110',
                )}
                style={{
                  color: account.ink,
                  boxShadow: `0 18px 36px -10px ${account.glow}`,
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
                {/* beUI Paper shader face — same family as the textured orb gallery */}
                <Shader
                  variant={account.shader.variant}
                  className="absolute inset-0 size-full"
                  {...account.shader.props}
                  // Freeze off-center orbs so five WebGL canvases stay cheap.
                  {...('speed' in account.shader.props
                    ? { speed: activeOrb ? account.shader.props.speed : 0 }
                    : {})}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15"
                />
                <span className="relative z-10 flex size-full items-center justify-center text-5xl font-semibold tracking-[-0.04em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-6xl md:text-7xl">
                  {account.short.slice(0, 1)}
                </span>
              </button>
              )
            })}
          </CylinderCarousel>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Drag, scroll or use arrow keys to roll
          </p>

          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="text-lg font-semibold text-foreground">{active.name}</p>
            <p className="text-sm text-muted-foreground">{active.role}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {active.email}
            </p>
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
