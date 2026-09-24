/* POST /api/family-invite — email a Family help invite when Resend is configured.

   Without RESEND_API_KEY the client falls back to mailto:/sms: composers so
   the invite still leaves the device from the patient's own mail/texts app.

     POST { to, name?, subject, text }
       -> 200 { ok: true }
       -> 503 not_configured | 401 no_session | 400 bad_request | 502 upstream
*/

const { sessionFrom } = require('../lib/session')

function readBody(req) {
  let b = req.body
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b)
    } catch {
      b = null
    }
  }
  return b && typeof b === 'object' ? b : {}
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  let session
  try {
    session = sessionFrom(req)
  } catch (e) {
    console.error('family-invite: session read failed —', (e && e.message) || e)
    return res.status(500).json({ error: 'server_misconfigured' })
  }
  if (!session) return res.status(401).json({ error: 'no_session' })

  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'BayouCare <onboarding@resend.dev>'
  if (!key) return res.status(503).json({ error: 'not_configured' })

  const body = readBody(req)
  const to = String(body.to || '')
    .trim()
    .toLowerCase()
  const subject = String(body.subject || '').trim()
  const text = String(body.text || '').trim()
  const name = String(body.name || '').trim()

  if (!to || !to.includes('@') || !subject || !text) {
    return res.status(400).json({ error: 'bad_request' })
  }

  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        ...(name ? { reply_to: undefined } : {}),
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      console.error('family-invite: Resend failed —', upstream.status, detail.slice(0, 300))
      return res.status(502).json({ error: 'upstream' })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('family-invite: send failed —', (e && e.message) || e)
    return res.status(502).json({ error: 'upstream' })
  }
}
