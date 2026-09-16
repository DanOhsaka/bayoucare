/* ---------- Session cookies ----------
   Signed, not encrypted. The payload is readable by anyone holding the cookie —
   the HMAC is what makes it unforgeable, and nothing secret is put in it: an id,
   an email, a role, an expiry, nothing more.

   The value is `base64url(payload).base64url(HMAC-SHA256)`. node:crypto is enough,
   so there is no JWT dependency to keep patched.

   Why a cookie rather than a token the client stores: index.html renders model
   output through innerHTML. That output is escaped, but if an XSS ever lands, a
   script-readable token is a stolen session. HttpOnly is not. */

const crypto = require('node:crypto');

const COOKIE = 'bc-session';
const MAX_AGE_S = 60 * 60 * 8;   /* 8h — a demo day, not a persistent login */

function secret(){
  const s = process.env.SESSION_SECRET;
  /* Fail closed and loudly. A missing or weak secret would let anyone who guesses
     it mint valid sessions, so refusing to run beats degrading quietly. */
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set and at least 32 characters');
  return s;
}

const b64 = buf => Buffer.from(buf).toString('base64url');
const sign = body => crypto.createHmac('sha256', secret()).update(body).digest('base64url');

function issue(user){
  const body = b64(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_S
  }));
  return body + '.' + sign(body);
}

function verify(token){
  if (typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i);
  const mac  = token.slice(i + 1);
  const want = sign(body);
  /* Constant-time compare. timingSafeEqual throws on a length mismatch, so the
     length check must come first — it reveals nothing the format doesn't. */
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch { return null; }
  if (!payload || typeof payload.exp !== 'number') return null;
  if (payload.exp * 1000 < Date.now()) return null;
  return payload;
}

function parseCookies(header){
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')){
    const i = part.indexOf('=');
    if (i < 1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/* The one call an endpoint needs to ask "who is this?". */
function sessionFrom(req){
  const header = req.headers && (req.headers.cookie || req.headers.Cookie);
  return verify(parseCookies(header)[COOKIE]);
}

/* Secure is set unconditionally, `vercel dev` included: browsers treat
   http://localhost as a secure context, so it works locally and there is no
   prod/dev divergence to get wrong later. */
function setCookie(token){
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}`;
}

function clearCookie(){
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

module.exports = { COOKIE, MAX_AGE_S, issue, verify, parseCookies, sessionFrom, setCookie, clearCookie };
