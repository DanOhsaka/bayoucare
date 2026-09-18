/* GET /api/patient — the patient the calling session resolves to.

   A separate endpoint rather than extra fields on /api/session, and that separation is
   the whole point. /api/session runs on EVERY page load to answer "is this person signed
   in?". Coupling that answer to Postgres would mean a database hiccup comes back as
   no_session — indistinguishable from an expired login — and the gate slams shut on the
   judges with no way back in. Here a failing database costs the patient binding and
   nothing else: the app falls back to its bundled record and keeps working.

   The patient is resolved from `sub`, which is already inside the signed cookie. No token
   change, no new claim, no session invalidation, and api/login.js, api/session.js,
   api/logout.js and lib/session.js are all untouched.

     GET /api/patient           -> 200 { id, name, mrn, city, dx }
     GET /api/patient?id=marcus -> clinician only; 403 for anyone else

   The extra fields beyond `id` are not used for rendering — index.html renders from its
   own bundled registry. They come back so the test suite can assert the identity source
   (this table) and the render source (the bundle) actually agree, rather than trusting
   that they do. See the agreement check in %TEMP%\bayoucare-drive\patients.js. */

const { sessionFrom } = require('../lib/session');
const { findPatient, patientIdForUser } = require('../lib/users');

module.exports = async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let session;
  try { session = sessionFrom(req); }
  catch(e){
    console.error('patient: session read failed —', (e && e.message) || e);
    return res.status(500).json({ error: 'server_misconfigured' });
  }
  if (!session) return res.status(401).json({ error: 'no_session' });

  /* 403 rather than a lying 404 for the role failure: a patient probing ?id= learns
     nothing from it — they already know their own role — and 403 is far easier to assert
     than a deliberately misleading 404. */
  const asked = (req.query && req.query.id) || null;

  try {
    let pid;
    if (asked){
      if (session.role !== 'clinician') return res.status(403).json({ error: 'forbidden' });
      pid = String(asked);
    } else {
      pid = await patientIdForUser(session.sub);
      if (!pid) return res.status(404).json({ error: 'not_found' });   /* staff account */
    }
    const p = await findPatient(pid);
    if (!p) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json(p);
  } catch(e){
    console.error('patient: lookup failed —', (e && e.message) || e);
    return res.status(500).json({ error: 'lookup_failed' });
  }
};
