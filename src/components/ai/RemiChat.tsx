import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Leaf, Send } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageIn } from '@/components/shared/Motion'
import { INPUT_CLASS } from '@/components/shared/Field'
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
    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.05em] text-link">
      Remi
    </span>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5 py-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="block size-1.5 rounded-full bg-brand-500 motion-safe:animate-[remi-dot_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: `${-0.16 * i}s` }}
        />
      ))}
    </span>
  )
}

function Bubble({ msg }: { msg: RemiMessage }) {
  const isUser = msg.role === 'user'

  return (
    <MessageIn>
      <div className={cn('flex items-start gap-2.5', isUser && 'flex-row-reverse')}>
        {!isUser && (
          <div
            className="mt-0.5 flex size-7 flex-none items-center justify-center rounded-full bg-brand-100 text-link"
            aria-hidden="true"
          >
            <Leaf className="size-3.5" strokeWidth={1.75} />
          </div>
        )}

        <div
          className={cn(
            'max-w-[min(85%,28rem)] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-sm)]',
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
            <div
              dangerouslySetInnerHTML={{
                __html: msg.streaming
                  ? `${msg.html}<span class="bc-remi-caret" aria-hidden="true"></span>`
                  : msg.html,
              }}
            />
          )}

          {msg.chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.chips.map((c, i) => (
                <Badge key={i} variant={c.kind}>
                  {c.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </MessageIn>
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
    if (!el || !pinnedRef.current) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
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
        className="flex max-h-[52vh] min-h-[220px] flex-col gap-3 overflow-y-auto overscroll-contain scroll-smooth p-1"
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
          className={cn(INPUT_CLASS, 'h-11 min-w-0 flex-1')}
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={busy || !draft.trim()}
          aria-label={t('remi.send')}
          className="size-11"
        >
          <Send className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">{t('remi.foot')}</p>
    </div>
  )
}
