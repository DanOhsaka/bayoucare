import { create } from 'zustand'

import { remiAnswer } from '@/engine/remi/answer'
import { buildRemiContext } from '@/engine/remi/context'
import { remiSafeHtml } from '@/engine/remi/safeHtml'
import { buildSystemPrompt } from '@/engine/remi/systemPrompt'
import { charDelay, countVisibleChars, typeHtmlPrefix } from '@/engine/remi/reveal'
import {
  REMI_KEY_SLOT,
  REMI_PROVIDERS,
  remiProviderOf,
  type ProviderId,
} from '@/engine/remi/providers'
import { interp, translate } from '@/lib/i18n'
import { getPatient, usePatient } from '@/store/patient'
import { useUi } from '@/store/ui'
import { useVitals } from '@/store/vitals'

/** Short beat of dots before letters start. Typing carries the rest. */
const REMI_THINK_MIN = 420
const THINK_SPREAD = 380

/** Shown only when DeepSeek and the on-device record both miss. */
const REMI_CLOUD_DOWN =
  `Sorry — I couldn't reach my cloud brain just now.<br><br>` +
  `Try again in a moment, or ask about something in your record: appointments, your plan, how you've been feeling, rides, or your care team.`

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
  /** True while letters are revealing into `html`. */
  streaming?: boolean
}

interface RemiState {
  messages: RemiMessage[]
  busy: boolean
  key: string
  provider: ProviderId
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

function greetingHtml(): string {
  const p = getPatient(usePatient.getState().pid)
  return interp(T('remi.greet'), { name: p.name.split(' ')[0] })
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const thinkMs = () => REMI_THINK_MIN + Math.round(Math.random() * THINK_SPREAD)

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function lastVisibleChar(html: string): string {
  for (let i = html.length - 1; i >= 0; i--) {
    if (html[i] === '>') {
      const open = html.lastIndexOf('<', i)
      if (open !== -1) {
        i = open
        continue
      }
    }
    if (html[i] === ';') {
      const amp = html.lastIndexOf('&', i)
      if (amp !== -1 && i - amp < 12) return ' '
    }
    return html[i]
  }
  return ' '
}

let greetGen = 0

async function streamReveal(
  set: (partial: Partial<RemiState> | ((s: RemiState) => Partial<RemiState>)) => void,
  id: number,
  fullHtml: string,
  chips: RemiChip[],
  gen?: number,
) {
  if (prefersReducedMotion()) {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, html: fullHtml, chips, pending: false, streaming: false } : m,
      ),
      busy: false,
    }))
    return
  }

  const total = countVisibleChars(fullHtml)
  set((s) => ({
    messages: s.messages.map((m) =>
      m.id === id ? { ...m, html: '', chips, pending: false, streaming: true } : m,
    ),
  }))

  // Reveal in small chunks so long replies do not setState once per glyph.
  const chunk = total > 280 ? 4 : total > 120 ? 3 : 2
  for (let n = chunk; n < total; n += chunk) {
    if (gen !== undefined && gen !== greetGen) return
    const prefix = typeHtmlPrefix(fullHtml, n)
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, html: prefix, chips, pending: false, streaming: true } : m,
      ),
    }))
    await delay(Math.max(10, charDelay(lastVisibleChar(prefix)) * 0.85))
  }

  if (gen !== undefined && gen !== greetGen) return
  set((s) => ({
    messages: s.messages.map((m) =>
      m.id === id ? { ...m, html: fullHtml, chips, pending: false, streaming: false } : m,
    ),
    busy: false,
  }))
}

/**
 * Ask DeepSeek through /api/remi (key stays on the server).
 * Returns null on any failure so the caller can try the browser path.
 */
async function askDeepSeekProxy(
  q: string,
  history: Array<{ role: string; content: string }>,
): Promise<string | null> {
  try {
    const r = await fetch('/api/remi', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system: buildSystemPrompt(buildRemiContext()),
        messages: history.concat([{ role: 'user', content: q }]),
      }),
    })
    if (!r.ok) return null
    const data = (await r.json()) as { text?: string }
    const text = String(data.text || '').trim()
    return text ? remiSafeHtml(text) : null
  } catch {
    return null
  }
}

/**
 * Direct browser call — DeepSeek allows CORS. Used when /api/remi is down
 * (plain Vite without the plugin, offline proxy) but a pasted key exists.
 */
async function askDeepSeekDirect(
  q: string,
  history: Array<{ role: string; content: string }>,
  key: string,
): Promise<string | null> {
  if (!key) return null
  const provider = REMI_PROVIDERS[remiProviderOf(key)]
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 20000)
  try {
    const r = await fetch(provider.url, {
      method: 'POST',
      signal: ctl.signal,
      headers: provider.headers(key),
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1024,
        temperature: 1.3,
        top_p: 0.95,
        thinking: { type: 'disabled' },
        system: buildSystemPrompt(buildRemiContext()),
        messages: history.concat([{ role: 'user', content: q }]).slice(-8),
      }),
    })
    if (!r.ok) return null
    const data = (await r.json()) as { content?: Array<{ type?: string; text?: string }> }
    const text = (data.content || [])
      .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('')
      .trim()
    return text ? remiSafeHtml(text) : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function askCloud(
  q: string,
  history: Array<{ role: string; content: string }>,
  key: string,
): Promise<string | null> {
  return (await askDeepSeekProxy(q, history)) ?? (await askDeepSeekDirect(q, history, key))
}

export const useRemi = create<RemiState>((set, get) => ({
  messages: [],
  busy: false,
  key: readKey(),
  provider: remiProviderOf(readKey()),
  history: [],

  greet() {
    if (get().messages.length || get().busy) return

    const gen = ++greetGen
    const pendingId = uid()
    set({
      busy: true,
      messages: [{ id: pendingId, role: 'remi', html: '', chips: [], pending: true }],
    })

    void (async () => {
      await delay(520 + Math.round(Math.random() * 280))
      if (gen !== greetGen) return
      await streamReveal(set, pendingId, greetingHtml(), [], gen)
    })()
  },

  async send(raw) {
    const q = String(raw ?? '').trim()
    if (!q || get().busy) return

    const gen = greetGen
    const userMsg: RemiMessage = { id: uid(), role: 'user', html: remiSafeHtml(q), chips: [] }
    set((s) => ({ messages: [...s.messages, userMsg], busy: true }))

    const pendingId = uid()
    set((s) => ({
      messages: [...s.messages, { id: pendingId, role: 'remi', html: '', chips: [], pending: true }],
    }))

    const dropIn = (html: string, chips: RemiChip[]) => {
      if (gen !== greetGen) return
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === pendingId ? { ...m, html, chips, pending: false, streaming: false } : m,
        ),
        busy: false,
      }))
    }

    try {
      const local = remiAnswer(q)
      const routed =
        local != null &&
        (local.tier === 'crisis' || local.tier === 'urgent' || local.tier === 'clinical')

      if (routed && local) {
        // Safety answers stay on-device and instant. Crisis language also
        // lands on Care Team → Needs attention — same list as the fever replay.
        if (local.tier === 'crisis') {
          const pid = usePatient.getState().pid
          useVitals.getState().raiseAlert({
            name: getPatient(pid).name,
            when: 'Just now',
            reading: 'Crisis language in Remi chat',
            msg: 'Patient disclosed crisis language to Remi. 988 was shown first. Care-team follow-up needed.',
            followup: 'Keisha Brown (SW) · Marie Thibodeaux, RN — reach out today',
            source: 'remi',
            kind: 'crisis',
            level: 'critical',
          })
        }
        dropIn(local.text, [])
        return
      }

      const { history, key } = get()
      // DeepSeek phrases the reply; local record intents are fallback only.
      const [cloud] = await Promise.all([askCloud(q, history, key), delay(thinkMs())])
      if (gen !== greetGen) return

      const text =
        cloud ||
        (local?.tier === 'record' ? local.text : null) ||
        REMI_CLOUD_DOWN
      await streamReveal(set, pendingId, text, [], gen)

      if (cloud) {
        set((s) => ({
          history: s.history
            .concat([
              { role: 'user', content: q },
              { role: 'assistant', content: text },
            ])
            .slice(-8),
        }))
      }
    } catch {
      dropIn(REMI_CLOUD_DOWN, [])
    }
  },

  saveKey(k) {
    try {
      localStorage.setItem(REMI_KEY_SLOT, k)
    } catch {
      /* not fatal */
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

usePatient.subscribe((state, prev) => {
  if (state.pid === prev.pid) return
  greetGen++
  useRemi.setState({ messages: [], history: [], busy: false })
  useRemi.getState().greet()
})

useUi.subscribe((state, prev) => {
  if (state.lang === prev.lang) return
  greetGen++
  useRemi.setState({ messages: [], history: [], busy: false })
  useRemi.getState().greet()
})
