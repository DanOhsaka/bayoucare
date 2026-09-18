/* Neon Postgres connection — the only place DATABASE_URL is read.

   Constructed lazily and cached per instance. Lazy because neon(undefined) throws at
   require() time, and this module is imported by every function that touches accounts —
   including api/login.js, which is the one endpoint that has to keep working when the
   database does not. A module-level `const sql = neon(process.env.DATABASE_URL)` would
   turn a missing or malformed connection string into a crash at import, i.e. a 500 on
   every route, i.e. nobody signs in. Failing at the call instead lets the fallback in
   lib/users.js do its job.

   @neondatabase/serverless speaks HTTP rather than TCP, so there is no pool to size and
   no socket to re-establish across cold starts — which is the whole reason it was chosen
   over a driver that needs a connection lifecycle. */

let _sql = null;

function sql(){
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  _sql = require('@neondatabase/serverless').neon(url);
  return _sql;
}

/* Parameterised query returning rows. Call sites pass placeholders ($1, $2), never
   interpolated strings, so parameterisation is structural rather than a convention
   someone has to remember. */
async function q(text, params){
  const r = await sql().query(text, params || []);
  return r.rows;
}

module.exports = { q, sql };
