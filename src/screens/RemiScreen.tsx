import { useState } from 'react'
import { Leaf, Settings2 } from 'lucide-react'

import { RemiChat } from '@/components/ai/RemiChat'
import { REMI_PROVIDERS } from '@/engine/remi/providers'
import { useRemi } from '@/store/remi'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

const PROMPT_KEYS = ['remi.q1', 'remi.q2', 'remi.q3', 'remi.q4']

export function RemiScreen() {
  const t = useT()
  const send = useRemi((s) => s.send)
  const busy = useRemi((s) => s.busy)
  const key = useRemi((s) => s.key)
  const provider = useRemi((s) => s.provider)
  const saveKey = useRemi((s) => s.saveKey)
  const clearKey = useRemi((s) => s.clearKey)

  const [draftKey, setDraftKey] = useState('')

  const engineLabel = key
    ? `${REMI_PROVIDERS[provider].label} ${t('remi.chipConnected')}`
    : t('remi.chipLocal')

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------------- header */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Leaf className="size-[18px] text-brand-600" aria-hidden="true" />
            Remi — your care assistant
          </h3>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
              key ? 'bg-success-bg text-success-fg' : 'bg-muted text-muted-foreground',
            )}
          >
            <i className="block size-1.5 rounded-full bg-current" aria-hidden="true" />
            {engineLabel}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{t('remi.sub')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROMPT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              disabled={busy}
              onClick={() => void send(t(k))}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {t(k)}
            </button>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- conversation */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <RemiChat />
      </section>

      {/* ------------------------------------------------------ connect a model */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
            {t('remi.connectHead')}
          </h3>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            {t('remi.connectChip')}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{t('remi.connectSub')}</p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <label htmlFor="remi-key" className="text-sm font-semibold">
              API key
            </label>
            <input
              id="remi-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-…"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              saveKey(draftKey.trim())
              setDraftKey('')
            }}
            disabled={!draftKey.trim()}
            className="h-10 rounded-md border border-brand-600 px-3.5 text-sm font-bold text-brand-700 transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t('remi.connectSave')}
          </button>
          <button
            type="button"
            onClick={() => {
              clearKey()
              setDraftKey('')
            }}
            className="h-10 rounded-md border border-border px-3.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            {t('remi.connectClear')}
          </button>
        </div>

        {/*
          The key is kept in this browser only. It must never move into an
          `import.meta.env.VITE_*` variable: Vite inlines any VITE_-prefixed
          value into the public bundle, which would publish the key in the
          JavaScript every visitor downloads.
        */}
        <p className="mt-2 text-xs text-muted-foreground">
          {key ? t('remi.keySaved') : t('remi.keyNone')}
        </p>
      </section>
    </div>
  )
}
