/**
 * Placeholder shell — Checkpoint 0 proves the toolchain, the token layer and the
 * deploy shape before any real screen is ported. Replaced by the real AppShell
 * at the end of this checkpoint.
 */
export default function App() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-foreground">BayouCare</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        React port scaffold. If the swatches below render, the token layer is live.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md bg-primary p-3 text-xs font-semibold text-primary-foreground">
          primary
        </div>
        <div className="rounded-md bg-success-bg p-3 text-xs font-semibold text-success-fg">
          success
        </div>
        <div className="rounded-md bg-warning-bg p-3 text-xs font-semibold text-warning-fg">
          warning
        </div>
        <div className="rounded-md bg-danger-bg p-3 text-xs font-semibold text-danger-fg">
          danger
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow)]">
        <p className="text-foreground">Card surface on the cream background.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Muted foreground. Toggle your OS theme to check dark mode.
        </p>
      </div>
    </main>
  )
}
