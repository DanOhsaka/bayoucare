import { create } from 'zustand'
import { toast } from 'sonner'

import type { CareTeamMember, PatientId } from '@/data'
import { translate } from '@/lib/i18n'
import { useUi } from '@/store/ui'

export type CareChatRole = 'patient' | 'staff'

export interface CareChatMessage {
  id: string
  role: CareChatRole
  text: string
  /** Short label for the bubble timestamp, e.g. "Just now". */
  when: string
}

interface CareChatState {
  /** `${patientId}:${memberSlug}` → messages */
  threads: Record<string, CareChatMessage[]>
  typing: Record<string, boolean>
  /** Unread staff messages per thread key. */
  unread: Record<string, number>
  /** Thread currently open in the chat UI — new replies there are not "unread". */
  viewingKey: string | null
  ensureThread: (pid: PatientId, member: CareTeamMember) => void
  send: (pid: PatientId, member: CareTeamMember, text: string) => void
  markRead: (key: string) => void
  setViewing: (key: string | null) => void
  reset: () => void
}

let seq = 0
function uid() {
  seq += 1
  return `care-msg-${seq}`
}

export function careMemberSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function threadKey(pid: PatientId, slug: string): string {
  return `${pid}:${slug}`
}

/** Total unread across a patient's care-team threads. */
export function unreadTotal(
  unread: Record<string, number>,
  pid: PatientId,
  members: CareTeamMember[],
): number {
  return members.reduce((n, m) => n + (unread[threadKey(pid, careMemberSlug(m.name))] ?? 0), 0)
}

function firstName(member: CareTeamMember): string {
  const raw = member.name.replace(/^Dr\.\s+/i, '').split(',')[0]?.trim() ?? member.name
  return raw.split(/\s+/)[0] ?? member.name
}

function greeting(member: CareTeamMember): string {
  const role = member.role.toLowerCase()
  const who = firstName(member)
  if (role.includes('oncolog')) {
    return `Hi — this is ${who}. Message me about symptoms, labs, or your next visit and I’ll get back to you.`
  }
  if (role.includes('navigator') || role.includes('nurse')) {
    return `Hi, I’m ${who}. I can help with scheduling, questions between visits, and anything confusing on your plan.`
  }
  if (role.includes('social') || role.includes('financial')) {
    return `Hi, I’m ${who}. Reach out anytime about rides, bills, lodging, or paperwork — that’s what I’m here for.`
  }
  if (role.includes('primary')) {
    return `Hi — ${who} here. Send a note if something feels off between visits and we’ll follow up.`
  }
  return `Hi, I’m ${who}. Send a message and I’ll reply as soon as I can.`
}

function autoReply(member: CareTeamMember, patientText: string): string {
  const role = member.role.toLowerCase()
  const q = patientText.toLowerCase()

  if (role.includes('social') || role.includes('financial')) {
    if (/ride|transport|pickup|drive/.test(q)) {
      return 'I can help arrange a ride. Tell me the appointment day and pickup address, and I’ll request non-emergency medical transport.'
    }
    if (/bill|copay|cost|money|medicaid|insurance/.test(q)) {
      return 'Thanks for flagging that. I can walk you through copay assistance and Medicaid paperwork — reply with the bill type and about when it’s due.'
    }
    return 'Got it. I’ll look into support options and message you back with next steps.'
  }

  if (role.includes('navigator') || role.includes('nurse')) {
    if (/appoint|schedul|resched|cancel|visit/.test(q)) {
      return 'I can help with that visit. Tell me which day you’re hoping for and I’ll check what’s open with the clinic.'
    }
    return 'Thanks for writing. I’ll check your chart and follow up — usually the same business day.'
  }

  if (role.includes('oncolog')) {
    if (/fever|pain|nausea|sick|bleed|short of breath/.test(q)) {
      return 'I’m glad you reached out. If you have a fever of 100.4°F or higher, go to urgent care or the ER and call the on-call line. Otherwise tell me when it started and how bad it feels (0–10).'
    }
    return 'Thanks — I read this. I’ll review it with the team and reply with guidance. For anything urgent after hours, use the clinic on-call number.'
  }

  return 'Thanks for your message. I’ll get back to you soon.'
}

function bumpUnread(
  unread: Record<string, number>,
  key: string,
  viewingKey: string | null,
): Record<string, number> {
  if (viewingKey === key) return unread
  return { ...unread, [key]: (unread[key] ?? 0) + 1 }
}

export const useCareChat = create<CareChatState>((set, get) => ({
  threads: {},
  typing: {},
  unread: {},
  viewingKey: null,

  setViewing(key) {
    set({ viewingKey: key })
    if (key) get().markRead(key)
  },

  markRead(key) {
    set((s) => {
      if (!s.unread[key]) return s
      const next = { ...s.unread }
      delete next[key]
      return { unread: next }
    })
  },

  ensureThread(pid, member) {
    const key = threadKey(pid, careMemberSlug(member.name))
    if (get().threads[key]?.length) return
    set((s) => ({
      threads: {
        ...s.threads,
        [key]: [
          {
            id: uid(),
            role: 'staff',
            text: greeting(member),
            when: 'Earlier',
          },
        ],
      },
    }))
  },

  send(pid, member, text) {
    const trimmed = text.trim()
    if (!trimmed) return

    const slug = careMemberSlug(member.name)
    const key = threadKey(pid, slug)
    get().ensureThread(pid, member)

    const patientMsg: CareChatMessage = {
      id: uid(),
      role: 'patient',
      text: trimmed,
      when: 'Just now',
    }

    set((s) => ({
      threads: {
        ...s.threads,
        [key]: [...(s.threads[key] ?? []), patientMsg],
      },
      typing: { ...s.typing, [key]: true },
    }))

    window.setTimeout(() => {
      const reply: CareChatMessage = {
        id: uid(),
        role: 'staff',
        text: autoReply(member, trimmed),
        when: 'Just now',
      }
      const { viewingKey } = get()
      set((s) => ({
        threads: {
          ...s.threads,
          [key]: [...(s.threads[key] ?? []), reply],
        },
        typing: { ...s.typing, [key]: false },
        unread: bumpUnread(s.unread, key, viewingKey),
      }))

      if (viewingKey !== key) {
        const preview = reply.text.length > 72 ? `${reply.text.slice(0, 72)}…` : reply.text
        const who = firstName(member)
        toast(translate(useUi.getState().lang, 'msg.toastNew').replace('{name}', who), {
          description: preview,
          action: {
            label: translate(useUi.getState().lang, 'msg.open'),
            onClick: () => {
              window.location.hash = `#/my-care/messages?with=${slug}`
            },
          },
        })
      }
    }, 900)
  },

  reset() {
    set({ threads: {}, typing: {}, unread: {}, viewingKey: null })
  },
}))
