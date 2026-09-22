import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ChevronLeft, MessageCircle, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { MessageIn } from '@/components/shared/Motion'
import { INPUT_CLASS } from '@/components/shared/Field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PATIENTS, type CareTeamMember } from '@/data'
import {
  careMemberSlug,
  threadKey,
  useCareChat,
  type CareChatMessage,
} from '@/store/careChat'
import { UnreadCount } from '@/components/shared/UnreadCount'
import { usePatient } from '@/store/patient'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

function memberSubtitle(m: CareTeamMember): string {
  const extra = (m.org as string | undefined) ?? (m.note as string | undefined)
  return extra ? `${m.role} · ${extra}` : m.role
}

function Bubble({ msg, staffName }: { msg: CareChatMessage; staffName: string }) {
  const isPatient = msg.role === 'patient'
  return (
    <MessageIn>
      <div className={cn('flex items-start gap-2.5', isPatient && 'flex-row-reverse')}>
        <div
          className={cn(
            'max-w-[min(85%,28rem)] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-sm)]',
            isPatient
              ? 'bg-brand-700 text-on-dark'
              : 'border border-border bg-card text-card-foreground',
          )}
        >
          {!isPatient && (
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.05em] text-link">
              {staffName}
            </span>
          )}
          <p>{msg.text}</p>
          <span
            className={cn(
              'mt-1 block text-[10px]',
              isPatient ? 'text-on-dark/70' : 'text-muted-foreground',
            )}
          >
            {msg.when}
          </span>
        </div>
      </div>
    </MessageIn>
  )
}

function ThreadView({
  member,
  onBack,
}: {
  member: CareTeamMember
  onBack: () => void
}) {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const slug = careMemberSlug(member.name)
  const key = threadKey(pid, slug)
  const ensureThread = useCareChat((s) => s.ensureThread)
  const send = useCareChat((s) => s.send)
  const markRead = useCareChat((s) => s.markRead)
  const setViewing = useCareChat((s) => s.setViewing)
  const messages = useCareChat((s) => s.threads[key] ?? [])
  const typing = useCareChat((s) => s.typing[key] ?? false)

  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  useEffect(() => {
    ensureThread(pid, member)
    setViewing(key)
    markRead(key)
    return () => {
      // Only clear if we still own the viewing slot (another thread may have taken it).
      if (useCareChat.getState().viewingKey === key) setViewing(null)
    }
  }, [ensureThread, setViewing, markRead, pid, member, key])

  useEffect(() => {
    markRead(key)
  }, [messages.length, key, markRead])

  useEffect(() => {
    const el = logRef.current
    if (!el || !pinnedRef.current) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }, [messages, typing])

  function onScroll() {
    const el = logRef.current
    if (!el) return
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = draft.trim()
    if (!q || typing) return
    setDraft('')
    send(pid, member, q)
  }

  const staffLabel = member.name.split(',')[0] ?? member.name

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label={t('msg.back')}
            className="mt-0.5"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <CardTitle className="text-base">{member.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{memberSubtitle(member)}</p>
          </div>
        </div>
        <Badge variant="success">{t('msg.secure')}</Badge>
      </CardHeader>

      <CardContent>
        <div
          ref={logRef}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-label={t('msg.threadLabel', { name: member.name })}
          className="flex max-h-[52vh] min-h-[240px] flex-col gap-3 overflow-y-auto overscroll-contain scroll-smooth p-1"
        >
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} staffName={staffLabel} />
          ))}
          {typing && (
            <p className="text-xs text-muted-foreground">{t('msg.typing', { name: staffLabel })}</p>
          )}
        </div>

        <form onSubmit={submit} className="mt-3 flex items-end gap-2 border-t border-border pt-3">
          <label htmlFor="care-chat-text" className="sr-only">
            {t('msg.ph')}
          </label>
          <input
            id="care-chat-text"
            type="text"
            autoComplete="off"
            placeholder={t('msg.ph')}
            value={draft}
            disabled={typing}
            onChange={(e) => setDraft(e.target.value)}
            className={cn(INPUT_CLASS, 'h-11 min-w-0 flex-1')}
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={typing || !draft.trim()}
            aria-label={t('msg.send')}
            className="size-11"
          >
            <Send className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">{t('msg.foot')}</p>
      </CardContent>
    </Card>
  )
}

export function CareChatScreen() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const [params, setParams] = useSearchParams()
  const withSlug = params.get('with')

  const active = useMemo(
    () => patient.careTeam.find((m) => careMemberSlug(m.name) === withSlug) ?? null,
    [patient.careTeam, withSlug],
  )

  const threads = useCareChat((s) => s.threads)
  const unread = useCareChat((s) => s.unread)

  function openMember(m: CareTeamMember) {
    setParams({ with: careMemberSlug(m.name) })
  }

  function clearMember() {
    setParams({})
  }

  if (active) {
    return (
      <div className="flex flex-col gap-4">
        <ThreadView member={active} onBack={clearMember} />
      </div>
    )
  }

  const totalUnread = patient.careTeam.reduce(
    (n, m) => n + (unread[threadKey(pid, careMemberSlug(m.name))] ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="size-[18px] text-brand-600" aria-hidden="true" />
            {t('msg.head')}
            <UnreadCount count={totalUnread} />
          </CardTitle>
          <Badge variant="success">{t('msg.chip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('msg.sub')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ul className="flex flex-col gap-2">
            {patient.careTeam.map((m) => {
              const key = threadKey(pid, careMemberSlug(m.name))
              const msgs = threads[key] ?? []
              const last = msgs[msgs.length - 1]
              const count = unread[key] ?? 0
              return (
                <li key={m.name}>
                  <button
                    type="button"
                    onClick={() => openMember(m)}
                    className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
                  >
                    <span className="relative flex size-10 flex-none items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
                      {(m.name.replace(/^Dr\.\s+/i, '')[0] ?? '?').toUpperCase()}
                      {count > 0 && (
                        <span className="absolute -right-1 -top-1">
                          <UnreadCount count={count} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm font-semibold text-card-foreground">{m.name}</b>
                      <span
                        className={cn(
                          'block text-xs',
                          count > 0
                            ? 'font-semibold text-card-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {last?.text ?? memberSubtitle(m)}
                      </span>
                    </span>
                    {count > 0 ? (
                      <UnreadCount count={count} />
                    ) : (
                      <span className="flex-none text-xs font-bold text-link">{t('msg.open')}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="mt-4 text-xs text-muted-foreground">
            {t('msg.remiHint')}{' '}
            <Link to="/my-care/remi" className="font-semibold text-link hover:underline">
              Remi
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
