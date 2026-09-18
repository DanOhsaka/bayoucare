/* GET /api/patients — the patient roster. Clinician only.

   Deliberately has NO fallback of any kind, and that is a feature: it makes this the
   database canary. Sign-in can succeed through the bundled fallback in lib/users.js while
   Postgres is down, which makes a broken DATABASE_URL look exactly like a working system
   — everyone gets in, and only the patient binding quietly stops updating. If this
   endpoint answers 200, the database is genuinely reachable. The test suite asserts it.

     GET /api/patients -> 200 { patients: [ { id, name, mrn, city, dx }, ... ] }
                       -> 401 no_session  |  403 forbidden  |  500 lookup_failed        */

const { sessionFrom } = require('../lib/session');
const { listPatients } = require('../lib/users');

module.exports = async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let session;
  try { session = sessionFrom(req); }
  catch(e){
    console.error('patients: session read failed —', (e && e.message) || e);
    return res.status(500).json({ error: 'server_misconfigured' });
  }
  if (!session) return res.status(401).json({ error: 'no_session' });
  if (session.role !== 'clinician') return res.status(403).json({ error: 'forbidden' });

  try {
    return res.status(200).json({ patients: await listPatients() });
  } catch(e){
    console.error('patients: roster lookup failed —', (e && e.message) || e);
    return res.status(500).json({ error: 'lookup_failed' });
  }
};
