const { findUser, verifyPassword } = require('../lib/users');
const { issue, setCookie } = require('../lib/session');

/* ---------------------------------------------------------------------------
   Rate limiting, and what it is actually worth. Measured, not assumed:

     - The counter is module state, so it lives and dies with the function instance.
     - `vercel dev` hands every request a fresh instance, so this never trips
       locally — 12 consecutive failures produced 12 × 401 and no 429. The same
       code called directly in one process gives the expected 8 × 401 then 429.
     - Production should behave differently, since Vercel reuses warm instances.
       That is a property of the platform, not something this code can promise.

   So: it raises the cost of hammering one instance, and does NOT stop an attacker
   who spreads attempts across instances or waits out a cold start. A durable
   counter (Upstash/Redis) is the real fix. This is the honest stopgap, and the
   comment says so rather than implying more protection than exists.
   --------------------------------------------------------------------------- */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function rateLimited(ip){
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.start > WINDOW_MS){
    attempts.set(ip, { start: now, n: 1 });
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_ATTEMPTS;
}

function clientIp(req){
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function readBody(req){
  let b = req.body;
  if (typeof b === 'string'){
    try { b = JSON.parse(b); } catch { b = null; }
  }
  return (b && typeof b === 'object') ? b : {};
}

module.exports = async function handler(req, res){
  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)){
    res.setHeader('Retry-After', String(WINDOW_MS / 1000));
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  const body = readBody(req);
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  if (!email || !password){
    return res.status(400).json({ error: 'missing_credentials' });
  }

  let user;
  try {
    user = await findUser(email);
  } catch (e){
    console.error('user lookup failed:', e && e.message);
    return res.status(500).json({ error: 'lookup_failed' });
  }

  /* verifyPassword always burns a bcrypt comparison, even for an unknown email,
     so neither the body nor the timing says which part was wrong. */
  const ok = await verifyPassword(user, password);
  if (!ok){
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  let token;
  try {
    token = issue(user);
  } catch (e){
    /* Almost always a missing/short SESSION_SECRET. Fail closed: no cookie, no
       session, and the message stays generic on the wire. */
    console.error('session issue failed:', e && e.message);
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  attempts.delete(ip);
  res.setHeader('Set-Cookie', setCookie(token));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ email: user.email, role: user.role });
};
