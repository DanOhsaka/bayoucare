const { sessionFrom } = require('../lib/session');

/* The client's "am I signed in?" call, made on every load. Returns the role so the
   app can land a patient in Patient mode and a clinician in Admin mode.
   Never calls res.setHeader('Cache-Control', 'public') — a cached 200 here would
   show one user's session to the next. */
module.exports = function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let s;
  try {
    s = sessionFrom(req);
  } catch (e){
    console.error('session read failed:', e && e.message);
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  if (!s) return res.status(401).json({ error: 'no_session' });

  return res.status(200).json({ email: s.email, role: s.role });
};
