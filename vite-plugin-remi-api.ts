import type { Connect, Plugin } from 'vite'

const DEEPSEEK_URL = 'https://api.deepseek.com/anthropic/v1/messages'
const MODEL = 'deepseek-chat'

/** Published demo credentials (same as the carousel / login card). Vite-only. */
const DEMO_LOGINS: ReadonlyArray<{ email: string; password: string; role: 'patient' | 'clinician' }> =
  [
    { email: 'patient@bayoucare.demo', password: 'patient2026', role: 'patient' },
    { email: 'marcus@bayoucare.demo', password: 'marcus2026', role: 'patient' },
    { email: 'yolanda@bayoucare.demo', password: 'yolanda2026', role: 'patient' },
    { email: 'priscilla@bayoucare.demo', password: 'priscilla2026', role: 'patient' },
    { email: 'clinician@bayoucare.demo', password: 'clinician2026', role: 'clinician' },
  ]

const VITE_COOKIE = 'bc-vite-demo'
const VITE_MAX_AGE_S = 60 * 60 * 8

type JsonBody = {
  system?: unknown
  messages?: unknown
  email?: unknown
  password?: unknown
}

type ViteSession = { email: string; role: 'patient' | 'clinician' }

function readJson(req: Connect.IncomingMessage): Promise<JsonBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? (JSON.parse(raw) as JsonBody) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: Connect.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(payload)
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function encodeViteSession(s: ViteSession): string {
  const payload = Buffer.from(
    JSON.stringify({ ...s, exp: Date.now() + VITE_MAX_AGE_S * 1000 }),
    'utf8',
  ).toString('base64url')
  return `${VITE_COOKIE}=${payload}; Path=/; SameSite=Lax; Max-Age=${VITE_MAX_AGE_S}`
}

function clearViteSession(): string {
  return `${VITE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`
}

function readViteSession(req: Connect.IncomingMessage): ViteSession | null {
  const raw = parseCookies(req.headers.cookie)[VITE_COOKIE]
  if (!raw) return null
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      email?: string
      role?: string
      exp?: number
    }
    if (!parsed?.email || (parsed.role !== 'patient' && parsed.role !== 'clinician')) return null
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null
    return { email: parsed.email, role: parsed.role }
  } catch {
    return null
  }
}

/**
 * Serves POST /api/remi inside `vite` so Remi works without a second
 * `vercel dev` process. Production still uses api/remi.js.
 *
 * Also answers session / demo login / logout locally when the Vercel Functions
 * proxy target is down — otherwise Vite returns a proxy 5xx (or login 401 from
 * a dead proxy) and the app cannot open or sign in with demo accounts.
 */
export function remiApiPlugin(env: Record<string, string>): Plugin {
  const key = String(env.DEEPSEEK_API_KEY || '').trim()

  return {
    name: 'bayoucare-remi-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]

        if (path === '/api/session' && req.method === 'GET') {
          const s = readViteSession(req)
          if (!s) return sendJson(res, 401, { error: 'no_session' })
          return sendJson(res, 200, { email: s.email, role: s.role })
        }

        if (path === '/api/logout' && req.method === 'POST') {
          res.setHeader('Set-Cookie', clearViteSession())
          return sendJson(res, 200, { ok: true })
        }

        if (path === '/api/login' && req.method === 'POST') {
          let body: JsonBody
          try {
            body = await readJson(req)
          } catch {
            return sendJson(res, 400, { error: 'missing_credentials' })
          }
          const email = String(body.email || '')
            .trim()
            .toLowerCase()
          const password = String(body.password || '')
          if (!email || !password) {
            return sendJson(res, 400, { error: 'missing_credentials' })
          }
          const match = DEMO_LOGINS.find((u) => u.email === email && u.password === password)
          if (!match) {
            return sendJson(res, 401, { error: 'invalid_credentials' })
          }
          const me = { email: match.email, role: match.role }
          res.setHeader('Set-Cookie', encodeViteSession(me))
          return sendJson(res, 200, me)
        }

        if (path !== '/api/remi') return next()

        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST')
          return sendJson(res, 405, { error: 'method_not_allowed' })
        }

        if (!key) return sendJson(res, 503, { error: 'not_configured' })

        let body: JsonBody
        try {
          body = await readJson(req)
        } catch {
          return sendJson(res, 400, { error: 'bad_request' })
        }

        const system = String(body.system || '').trim()
        const messages = Array.isArray(body.messages) ? body.messages : null
        if (!system || !messages?.length) {
          return sendJson(res, 400, { error: 'bad_request' })
        }

        const trimmed = messages
          .filter(
            (m): m is { role: string; content: string } =>
              !!m &&
              typeof m === 'object' &&
              ((m as { role?: string }).role === 'user' ||
                (m as { role?: string }).role === 'assistant') &&
              typeof (m as { content?: unknown }).content === 'string',
          )
          .slice(-8)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }))

        if (!trimmed.length) return sendJson(res, 400, { error: 'bad_request' })

        const ctl = new AbortController()
        const timer = setTimeout(() => ctl.abort(), 20000)

        try {
          const upstream = await fetch(DEEPSEEK_URL, {
            method: 'POST',
            signal: ctl.signal,
            headers: {
              'x-api-key': key,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 1024,
              temperature: 1.3,
              top_p: 0.95,
              thinking: { type: 'disabled' },
              system: system.slice(0, 12000),
              messages: trimmed,
            }),
          })

          if (!upstream.ok) {
            const errText = await upstream.text().catch(() => '')
            console.error('vite remi: deepseek http', upstream.status, errText.slice(0, 200))
            return sendJson(res, 502, { error: 'upstream' })
          }

          const data = (await upstream.json()) as {
            content?: Array<{ type?: string; text?: string }>
          }
          const text = (data.content || [])
            .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
            .map((c) => c.text)
            .join('')
            .trim()

          if (!text) return sendJson(res, 502, { error: 'empty' })
          return sendJson(res, 200, { text })
        } catch (e) {
          console.error('vite remi: deepseek failed —', (e as Error)?.message || e)
          return sendJson(res, 502, { error: 'upstream' })
        } finally {
          clearTimeout(timer)
        }
      })
    },
  }
}
