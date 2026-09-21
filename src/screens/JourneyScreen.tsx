import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/**
 * The timeline steps. `state` is the legacy `done` / `now` / (neither) class.
 *
 * The step labels come from the dictionary, but the dates inside `td` are part
 * of the same translated string — the legacy kept whole sentences per key
 * rather than baking dates into shared fragments, which is why these read a
 * little oddly as keys.
 */
const STEPS = [
  { state: 'done', tw: 'journey.j1tw', td: 'journey.j1td' },
  { state: 'done', tw: 'journey.j2tw', td: 'journey.j2td' },
  { state: 'done', tw: 'journey.j3tw', td: 'journey.j3td' },
  { state: 'now', tw: 'journey.j4tw', td: 'journey.j4td' },
  { state: 'todo', tw: 'journey.j5tw', td: 'journey.j5td' },
  { state: 'todo', tw: 'journey.j6tw', td: 'journey.j6td' },
]

export function JourneyScreen() {
  const t = useT()

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">{t('journey.head')}</h3>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {t('journey.chip')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('journey.sub')}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <ol className="flex flex-col">
          {STEPS.map((s, i) => {
            const done = s.state === 'done'
            const now = s.state === 'now'
            return (
              <li key={s.tw} className="flex gap-3.5">
                {/* The rail: a mark, then a connector down to the next step. */}
                <div className="flex flex-none flex-col items-center">
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-bold',
                      done
                        ? 'bg-brand-500 text-on-dark'
                        : now
                          ? 'border-2 border-brand-600 bg-accent text-brand-700'
                          : 'border border-border bg-background text-muted-foreground',
                    )}
                    aria-hidden="true"
                  >
                    {done ? '✓' : now ? '●' : i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn('w-px flex-1', done ? 'bg-brand-500/40' : 'bg-border')}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className={cn('pb-6', i === STEPS.length - 1 && 'pb-0')}>
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      now ? 'text-brand-700' : 'text-card-foreground',
                    )}
                  >
                    {t(s.tw)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t(s.td)}</div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
