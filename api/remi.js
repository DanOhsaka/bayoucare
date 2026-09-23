/* POST /api/remi — phrase a Remi answer via DeepSeek.

   The API key stays on the server (DEEPSEEK_API_KEY). The browser only sends
   the question, a short history, and the system prompt built from the patient's
   on-device record. Crisis / urgent / clinical routing still happens client-side
   before this endpoint is ever called.

     POST /api/remi { system, messages }
       -> 200 { text }
       -> 401 no_session | 503 not_configured | 502 upstream | 400 bad_request
*/

const { sessionFrom } = require('../lib/session');

const DEEPSEEK_URL = 'https://api.deepseek.com/anthropic/v1/messages';
const MODEL = 'deepseek-chat';

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch {
      b = null;
    }
  }
  return b && typeof b === 'object' ? b : {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let session;
  try {
    session = sessionFrom(req);
  } catch (e) {
    console.error('remi: session read failed —', (e && e.message) || e);
    return res.status(500).json({ error: 'server_misconfigured' });
  }
  if (!session) return res.status(401).json({ error: 'no_session' });

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });

  const body = readBody(req);
  const system = String(body.system || '').trim();
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!system || !messages || !messages.length) {
    return res.status(400).json({ error: 'bad_request' });
  }

  // Cap history so a long chat cannot blow the prompt.
  const trimmed = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

  if (!trimmed.length) return res.status(400).json({ error: 'bad_request' });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);

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
        // Conversation / warm helper — DeepSeek recommends ~1.3. Thinking must
        // be off or temperature is ignored.
        temperature: 1.3,
        top_p: 0.95,
        thinking: { type: 'disabled' },
        system: system.slice(0, 12000),
        messages: trimmed,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('remi: deepseek http', upstream.status, errText.slice(0, 200));
      return res.status(502).json({ error: 'upstream' });
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('')
      .trim();

    if (!text) return res.status(502).json({ error: 'empty' });
    return res.status(200).json({ text });
  } catch (e) {
    console.error('remi: deepseek failed —', (e && e.message) || e);
    return res.status(502).json({ error: 'upstream' });
  } finally {
    clearTimeout(timer);
  }
};
