/* Idempotent seed: creates the tables if they are missing and upserts the roster and the
   accounts. CREATE TABLE IF NOT EXISTS plus ON CONFLICT is the whole migration story —
   on a two-table schema with a week to finals, a migration runner is a liability with
   nothing to roll back.

   Run it against the Neon connection string:

     node --env-file=.env.local scripts/seed.js

   The explicit --env-file is not decoration: `vercel dev` does NOT load .env.local (a
   measured trap in this project), so nothing here relies on implicit loading.

   The two legacy accounts are inserted with their LITERAL hashes from lib/users.js, so
   the passwords printed on the sign-in card keep working byte-identically and there is no
   window where re-seeding invalidates a credential. The three per-patient accounts are
   hashed here at the same cost. Their hash IS refreshed on re-seed, which is intentional:
   the published passwords are the ones on the card, so re-seeding should restore them. */

const bcrypt = require('bcryptjs');
const { q } = require('../lib/db');
const { PATIENTS, NEW_ACCOUNTS, LEGACY_PIDS } = require('../lib/records');
const users = require('../lib/users');

async function main(){
  await q(`CREATE TABLE IF NOT EXISTS patients (
    id           text PRIMARY KEY,
    display_name text NOT NULL,
    mrn          text NOT NULL,
    city         text NOT NULL,
    dx           text NOT NULL
  )`);

  await q(`CREATE TABLE IF NOT EXISTS users (
    id         text PRIMARY KEY,
    email      text NOT NULL UNIQUE,
    role       text NOT NULL CHECK (role IN ('patient','clinician')),
    hash       text NOT NULL,
    patient_id text REFERENCES patients(id)
  )`);

  for (const p of PATIENTS){
    await q(`INSERT INTO patients (id, display_name, mrn, city, dx)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET
               display_name = EXCLUDED.display_name,
               mrn          = EXCLUDED.mrn,
               city         = EXCLUDED.city,
               dx           = EXCLUDED.dx`,
            [p.id, p.name, p.mrn, p.city, p.dx]);
    console.log('patient  ' + p.id + '  ' + p.name);
  }

  for (const u of users.SEED){
    await q(`INSERT INTO users (id, email, role, hash, patient_id)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET
               email      = EXCLUDED.email,
               role       = EXCLUDED.role,
               hash       = EXCLUDED.hash,
               patient_id = EXCLUDED.patient_id`,
            [u.id, u.email, u.role, u.hash, LEGACY_PIDS[u.id] || null]);
    console.log('account  ' + u.email + '  ' + u.role + '  (legacy hash preserved)');
  }

  for (const a of NEW_ACCOUNTS){
    await q(`INSERT INTO users (id, email, role, hash, patient_id)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET
               email      = EXCLUDED.email,
               role       = EXCLUDED.role,
               hash       = EXCLUDED.hash,
               patient_id = EXCLUDED.patient_id`,
            [a.id, a.email, a.role, bcrypt.hashSync(a.password, 10), a.pid]);
    console.log('account  ' + a.email + '  ' + a.role + '  pid=' + a.pid);
  }

  const pts = await q('SELECT id FROM patients');
  const us  = await q('SELECT id, patient_id FROM users');
  console.log('\nseeded ' + pts.length + ' patients and ' + us.length + ' accounts');
}

main().catch(e => {
  console.error('\nseed failed: ' + ((e && e.message) || e));
  process.exit(1);
});
