import { create } from 'zustand'

import { remiAnswer } from '@/engine/remi/answer'
import { buildRemiContext } from '@/engine/remi/context'
import { remiSafeHtml } from '@/engine/remi/safeHtml'
import { buildSystemPrompt } from '@/engine/remi/systemPrompt'
import { REMI_FALLBACK } from '@/engine/remi/triage'
import {
  REMI_KEY_SLOT,
  REMI_PROVIDERS,
  remiProviderOf,
  type ProviderId,
} from '@/engine/remi/providers'
import { PATIENTS } from '@/data'
import { interp, translate } from '@/lib/i18n'
import { usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'

/** The legacy pacing, kept stage-tunable. Set both to 0 to demo instantly. */
const REMI_THINK_MIN = 700
const THINK_SPREAD = 800

export interface RemiChip {
  label: string
  kind: 'success' | 'warning' | 'neutral'
}

export interface RemiMessage {
  id: number
  role: 'user' | 'remi'
  html: string
  chips: RemiChip[]
  /** True while the dots are showing; the bubble settles in place. */
  pending?: boolean
}

interface RemiState {
  messages: RemiMessage[]
  busy: boolean
  key: string
  provider: ProviderId
  /** Last few turns, cloud path only. */
  history: Array<{ role: string; content: string }>

  greet: () => void
  send: (raw: string) => Promise<void>
  saveKey: (k: string) => void
  clearKey: () => void
}

let nextId = 1
const uid = () => nextId++

function readKey(): string {
  try {
    return localStorage.getItem(REMI_KEY_SLOT) ?? ''
  } catch {
    return ''
  }
}

const T = (key: string) => translate(useUi.getState().lang, key)

/**
 * The opening line, with the patient's first name substituted.
 *
 * Rendered RAW, not through remiSafeHtml: the greeting uses `<br><br>`, and the
 * sanitiser only restores `<b>` — escaping it would print literal `<br>` tags,
 * which is the exact bug the legacy file's own comment documents.
 */
function greetingHtml(): string {
  const p = PATIENTS[usePatient.getState().pid]
  return interp(T('remi.greet'), { name: p.name.split(' ')[0] })
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const thinkMs = () => REMI_THINK_MIN + Math.round(Math.random() * THINK_SPREAD)

/**
 * The optional cloud path. Every failure — no key, offline, non-2xx, timeout,
 * empty body — returns null and the caller keeps the on-device answer, so the
 * patient is never left with nothing.
 */
async function askCloud(q: string, key: string, history: Array<{ role: string; content: string }>) {
  const p = REMI_PROVIDERS[remiProviderOf(key)]
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 15000)
  try {
    const r = await fetch(p.url, {
      method: 'POST',
      signal: ctl.signal,
      headers: p.headers(key),
      body: JSON.stringify({
        model: p.model,
        max_tokens: 1024,
        system: buildSystemPrompt(buildRemiContext()),
        messages: history.concat([{ role: 'user', content: q }]),
      }),
    })
    if (!r.ok) throw new Error('http ' + r.status)
    const data = await r.json()
    const out = (data.content || [])
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('')
      .trim()
    if (!out) throw new Error('empty')
    return { text: remiSafeHtml(out), provider: remiProviderOf(key) }
  } finally {
    clearTimeout(timer)
  }
}

export const useRemi = create<RemiState>((set, get) => ({
  messages: [],
  busy: false,
  key: readKey(),
  provider: remiProviderOf(readKey()),
  history: [],

  /** Replaced rather than appended, so it can never appear twice. */
  greet() {
    set((s) =>
      s.messages.length
        ? s
        : { messages: [{ id: uid(), role: 'remi', html: greetingHtml(), chips: [] }] },
    )
  },

  async send(raw) {
    const q = String(raw ?? '').trim()
    if (!q || get().busy) return

    const userMsg: RemiMessage = { id: uid(), role: 'user', html: remiSafeHtml(q), chips: [] }
    set((s) => ({ messages: [...s.messages, userMsg], busy: true }))

    // Computed synchronously and BEFORE any await — the local engine is what
    // decides the tier, and therefore whether this is routed at all.
    const local = remiAnswer(q) ?? { text: REMI_FALLBACK, tier: 'unknown' as const, engine: 'local' as const }
    const routed = local.tier === 'crisis' || local.tier === 'urgent' || local.tier === 'clinical'

    const pendingId = uid()
    set((s) => ({
      messages: [...s.messages, { id: pendingId, role: 'remi', html: '', chips: [], pending: true }],
    }))

    const settle = (html: string, chips: RemiChip[]) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === pendingId ? { ...m, html, chips, pending: false } : m)),
      }))

    const { key, history } = get()
    let text = local.text
    let degraded = false

    if (routed) {
      /*
       * A crisis, an emergency, or a clinical question is decided ON-DEVICE and
       * answered on-device — it never reaches the model, connected or not.
       *
       * Those tiers also SKIP the thinking beat below. The pause is theatre, and
       * making someone wait a beat and a half for a 988 number is not acceptable.
       * Routed answers land the instant they are computed.
       */
      settle(local.text, [{ label: T('remi.chipLocal'), kind: 'neutral' }])
    } else {
      if (key) {
        // The real round trip drives the indicator, with the thinking beat as a
        // floor so a fast connection still feels like an answer being composed.
        const [cloud] = await Promise.all([
          askCloud(q, key, history).catch(() => {
            degraded = true
            return null
          }),
          delay(thinkMs()),
        ])
        if (cloud) text = cloud.text
      } else {
        await delay(thinkMs())
      }

      const chips: RemiChip[] = [
        {
          label: key ? `${REMI_PROVIDERS[remiProviderOf(key)].label} ${T('remi.chipConnected')}` : T('remi.chipLocal'),
          kind: 'success',
        },
      ]
      if (degraded) chips.push({ label: T('remi.degraded'), kind: 'warning' })
      settle(text, chips)

      if (key && !degraded) {
        set((s) => ({
          history: s.history
            .concat([
              { role: 'user', content: q },
              { role: 'assistant', content: text },
            ])
            .slice(-8),
        }))
      }
    }

    set({ busy: false })
  },

  saveKey(k) {
    try {
      localStorage.setItem(REMI_KEY_SLOT, k)
    } catch {
      /* not fatal — the key just will not persist */
    }
    set({ key: k, provider: remiProviderOf(k) })
  },

  clearKey() {
    try {
      localStorage.removeItem(REMI_KEY_SLOT)
    } catch {
      /* not fatal */
    }
    set({ key: '', history: [] })
  },
}))

/**
 * Switching patient restarts the conversation.
 *
 * The greeting names the patient and every answer is grounded in their record,
 * so carrying a transcript across a switch would show one patient's chart under
 * another patient's name — the same class of bug the identity binding exists to
 * prevent. The legacy app re-greeted on every render for this reason.
 */
usePatient.subscribe((state, prev) => {
  if (state.pid === prev.pid) return
  useRemi.setState({ messages: [], history: [], busy: false })
  useRemi.getState().greet()
})
