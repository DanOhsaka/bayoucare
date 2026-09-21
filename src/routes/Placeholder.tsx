import { Construction } from 'lucide-react'

/**
 * Stands in for a screen that has not been ported yet.
 *
 * Links to the legacy build on purpose: during the port the honest way to check
 * that a screen still works is to compare against the original, and that link
 * stays available in production because `public/legacy.html` ships in the build.
 * Each placeholder is replaced as its screen is ported.
 */
export function Placeholder({ title, view }: { title: string; view: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Construction className="size-4" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-[0.05em]">Not yet ported</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>

      <p className="mt-3 text-base text-muted-foreground">
        This screen is still served by the original single-file app while the React port is
        under way. Nothing here is broken — it simply has not been rebuilt yet.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <p className="text-sm text-card-foreground">
          Compare against the original, which is deployed alongside this build:
        </p>
        <a
          href="./legacy.html"
          className="mt-3 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the legacy app →
        </a>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          view: {view} · served at /legacy.html
        </p>
      </div>
    </div>
  )
}
