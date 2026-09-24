import { BrandLogo } from '@/components/shared/BrandLogo'
import { Loader } from '@/components/motion/loader'

/**
 * Session boot shell — matches signed-in chrome proportions so switching to
 * AppShell does not jump from a centered logo to a full header layout.
 *
 * Still free of patient record data.
 */
export function PendingShell() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-dvh w-full flex-col overflow-x-clip bg-background [background-image:radial-gradient(1200px_600px_at_50%_-10%,rgba(42,138,98,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_28%)] dark:[background-image:radial-gradient(1000px_500px_at_50%_-8%,rgba(61,154,111,0.14),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]"
    >
      <div className="glass flex h-[3.75rem] shrink-0 items-center border-b border-border px-3 sm:px-5 lg:h-[3.25rem]">
        <BrandLogo
          size="sm"
          className="max-w-[9rem] overflow-hidden rounded-lg bg-card shadow-[var(--shadow-sm)]"
          imgClassName="max-h-8 w-auto object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <Loader variant="comet" size={36} label="Loading" className="text-primary" />
        <p className="text-sm text-muted-foreground">Loading your session…</p>
      </div>
    </div>
  )
}
