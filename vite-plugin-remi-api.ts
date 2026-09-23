import type { Connect, Plugin } from 'vite'

const DEEPSEEK_URL = 'https://api.deepseek.com/anthropic/v1/messages'
const MODEL = 'deepseek-chat'

type JsonBody = {
  system?: unknown
  messages?: unknown
}

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

/**
 * Serves POST /api/remi inside `vite` so Remi works without a second
 * `vercel dev` process. Production still uses api/remi.js.
 */
export function remiApiPlugin(env: Record<string, string>): Plugin {
  const key = String(env.DEEPSEEK_API_KEY || '').trim()

  return {
    name: 'bayoucare-remi-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]
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
