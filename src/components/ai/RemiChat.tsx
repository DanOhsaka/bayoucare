import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Send, User } from 'lucide-react'

import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageFooter,
  MessageHeader,
  MessageTyping,
} from '@/components/agents/message'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRemi, type RemiMessage } from '@/store/remi'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

function Bubble({ msg }: { msg: RemiMessage }) {
  const isUser = msg.role === 'user'

  return (
    <Message from={isUser ? 'user' : 'assistant'} animateIn>
      <MessageAvatar
        className={cn(
          isUser
            ? 'bg-foreground text-background'
            : 'border border-border bg-card text-muted-foreground',
        )}
      >
        {isUser ? <User /> : <Bot />}
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>
          <span className="font-medium text-foreground/80">{isUser ? 'You' : 'Remi'}</span>
          <span>·</span>
          <span>Now</span>
        </MessageHeader>
        <MessageBubble variant={isUser ? 'solid' : 'soft'} animateIn>
          <MessageBubbleContent>
            {msg.pending ? (
              <MessageTyping label="Remi is typing" />
            ) : (
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
          </MessageBubbleContent>
        </MessageBubble>
        {isUser ? (
          <MessageFooter>
            <span>Delivered</span>
          </MessageFooter>
        ) : null}
      </MessageContent>
    </Message>
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
        className="flex max-h-[min(52dvh,calc(100dvh-14rem))] min-h-[12rem] flex-col gap-4 overflow-y-auto overscroll-contain scroll-smooth p-1 [scrollbar-gutter:stable] sm:max-h-[min(52vh,calc(100dvh-16rem))] sm:min-h-[220px]"
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
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={busy || !draft.trim()}
          aria-label={t('remi.send')}
          className="size-11 rounded-full"
        >
          <Send className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">{t('remi.foot')}</p>
    </div>
  )
}
