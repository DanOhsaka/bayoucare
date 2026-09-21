import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Leaf, Send } from 'lucide-react'

import { useRemi, type RemiMessage } from '@/store/remi'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/**
 * The speaker label.
 *
 * The legacy app prefixed every answer with a literal `<b>Remi</b>` and styled
 * it with `.msg .b > b:first-child{display:block}` — a rule whose own comment
 * warns that a `<b>` used for emphasis *inside* an answer must stay inline. That
 * contract broke once already. A real element cannot drift into the content, so
 * this replaces it.
 */
function MessageAuthor() {
  return (
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] text-link">
      Remi
    </span>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="block size-1.5 rounded-full bg-brand-500"
            style={{ animation: 'remi-dot 1.2s infinite', animationDelay: `${-0.16 * i}s` }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">thinking…</span>
    </span>
  )
}

const CHIP_KIND: Record<string, string> = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  neutral: 'bg-muted text-muted-foreground',
}

function Bubble({ msg }: { msg: RemiMessage }) {
  const isUser = msg.role === 'user'

  return (
    <div className={cn('flex items-start gap-2.5', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div
          className="mt-0.5 flex size-7 flex-none items-center justify-center rounded-full bg-brand-100 text-link"
          aria-hidden="true"
        >
          <Leaf className="size-3.5" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-700 text-on-dark'
            : 'border border-border bg-card text-card-foreground',
        )}
      >
        {!isUser && <MessageAuthor />}

        {msg.pending ? (
          <TypingDots />
        ) : (
          /*
            Local answers are authored strings in this repo and use <br>, which
            the sanitiser does not restore — so they render raw, exactly as the
            legacy app did. Cloud answers were already escaped by remiSafeHtml
            on the way in, and user text was escaped in the store. This is the
            one place HTML reaches Remi's DOM.
          */
          <div dangerouslySetInnerHTML={{ __html: msg.html }} />
        )}

        {msg.chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.chips.map((c, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                  CHIP_KIND[c.kind],
                )}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function RemiChat() {
  const t = useT()
  const messages = useRemi((s) => s.messages)
  const busy = useRemi((s) => s.busy)
  const send = useRemi((s) => s.send)
  const greet = useRemi((s) => s.greet)

  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  // Whether the reader is at the bottom is captured BEFORE a new message lands,
  // so someone reading back through the log is not yanked down by an answer
  // arriving. The legacy app had the same behaviour.
  const pinnedRef = useRef(true)

  useEffect(() => {
    greet()
  }, [greet])

  useEffect(() => {
    const el = logRef.current
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  function onScroll() {
    const el = logRef.current
    if (!el) return
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = draft.trim()
    if (!q || busy) return
    setDraft('')
    void send(q)
  }

  return (
    <div className="flex flex-col">
      <div
        ref={logRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Remi"
        className="flex max-h-[52vh] min-h-[220px] flex-col gap-3 overflow-y-auto overscroll-contain p-1"
      >
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 flex items-end gap-2 border-t border-border pt-3">
        <label htmlFor="remi-text" className="sr-only">
          {t('remi.ph')}
        </label>
        <input
          id="remi-text"
          type="text"
          autoComplete="off"
          placeholder={t('remi.ph')}
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label={t('remi.send')}
          className="flex size-11 flex-none items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">{t('remi.foot')}</p>
    </div>
  )
}
