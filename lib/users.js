/* ---------- Accounts and the patient roster ----------
   The only storage-aware module in the backend. Everything above it — the endpoints, the
   client — is unaware of where any of this lives. lib/db.js owns the connection; this
   module owns the queries.

   Reads go to Postgres. If the database is unreachable they fall back to the two accounts
   bundled in SEED below, so an outage degrades to exactly the behaviour this app had
   before the database existed rather than locking every judge out of a live demo.

   The fallback is not a meaningful hole, and the argument is narrower than "it's only a
   demo": index.html prints both accounts and both passwords on the sign-in screen, so any
   visitor already holds them. Serving them during an outage grants no account, no role and
   no data that is not already published. The residual risk is exactly one thing, and it is
   worth naming rather than waving away — a password rotated in the database would still be
   accepted while the database is unreachable. Bounded, and only for accounts whose
   credentials are on the public login card.

   COROLLARY, and it is load-bearing: SEED must stay at exactly these two accounts. Adding
   the per-patient accounts here would mean a database outage exposed logins the published
   card does not show.

   Only bcrypt hashes are stored here — never plaintext. The passwords are published on the
   sign-in screen because this is a judged demo and judges need to log in; they are NOT real
   credentials and must never be reused elsewhere. */

const bcrypt = require('bcryptjs');
const { q } = require('./db');

/* Cost 10 is the bcrypt default. It makes offline guessing expensive at roughly
   60ms a verify, which is affordable on a cold start and unnoticeable to a user. */
const SEED = [
  {
    id: 'u_patient',
    email: 'patient@bayoucare.demo',
    role: 'patient',
    hash: '$2b$10$//hVmYnacYezfvxlCMSCl.NUCsLxCaXkhqFFdyH3KI.DWSWUihDcq'
  },
  {
    id: 'u_clinician',
    email: 'clinician@bayoucare.demo',
    role: 'clinician',
    hash: '$2b$10$hJGypti/nkUhZ2lj8ut6k.gQ6w9/d54EWxLpUAP.T9gdOHB9aVnbK'
  }
];

/* Compared against when the email is unknown, so a missing account costs the same
   ~60ms as a wrong password. Without it, response time tells an attacker which
   emails are real. */
const DUMMY_HASH = '$2b$10$kPbwUocbQO9ZVR2cU4gSaOOUPkB/0Jz8Y.YYgKQcN0ltocekBpvCW';

function normalize(email){
  return String(email || '').trim().toLowerCase();
}

/* The `hash` key is required by verifyPassword below, and `pid` carries the patient this
   account resolves to (null for staff) — renaming either silently breaks the sign-in path. */
async function findUser(email){
  const e = normalize(email);
  if (!e) return null;
  try {
    const rows = await q(
      'SELECT id, email, role, hash, patient_id AS pid FROM users WHERE email = $1', [e]);
    /* A reachable database that does not know this email means the account does not
       exist. Returning null rather than falling through to SEED is deliberate: the
       fallback is for an outage, never for a miss. */
    return rows.length ? rows[0] : null;
  } catch (err){
    console.error('users: database unreachable, falling back to the bundled accounts —',
      (err && err.message) || err);
    return SEED.find(u => u.email === e) || null;
  }
}

/* Always runs a comparison, even when the user does not exist. Returns whether the
   credentials are good; the caller decides what to say, so a failed login cannot
   distinguish "no such account" from "wrong password" in either body or timing. */
async function verifyPassword(user, password){
  const hash = user ? user.hash : DUMMY_HASH;
  const ok = await bcrypt.compare(String(password || ''), hash);
  return !!user && ok;
}

/* The roster. Returns scalars only — see lib/records.js for why the chart itself is not
   stored server-side. Ordered by display name so the switcher is stable between loads. */
async function listPatients(){
  return q('SELECT id, display_name AS name, mrn, city, dx FROM patients ORDER BY display_name');
}

async function findPatient(id){
  const rows = await q(
    'SELECT id, display_name AS name, mrn, city, dx FROM patients WHERE id = $1', [String(id || '')]);
  return rows.length ? rows[0] : null;
}

/* The patient a signed-in account resolves to. Joins on the session's `sub`, not on
   email: email is mutable in a way an id is not, and `sub` is already the session's
   identity claim. Returns null for staff and for unknown accounts. */
async function patientIdForUser(userId){
  const rows = await q('SELECT patient_id FROM users WHERE id = $1', [String(userId || '')]);
  return rows.length ? rows[0].patient_id : null;
}

module.exports = { findUser, verifyPassword, listPatients, findPatient, patientIdForUser, SEED, DUMMY_HASH };
