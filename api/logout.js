const { clearCookie } = require('../lib/session');

/* Clearing the cookie is the whole logout. There is no server-side session store
   to invalidate — the session lives entirely in the signed cookie — so this cannot
   revoke a token that was already copied off the device. That is the cost of a
   stateless session, and it is the right trade for a demo with an 8h expiry. */
module.exports = function handler(req, res){
  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  res.setHeader('Set-Cookie', clearCookie());
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true });
};
