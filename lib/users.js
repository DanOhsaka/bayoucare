/* ---------- Accounts ----------
   The only storage-aware module in the backend. Everything above it — the
   endpoints, the client — knows nothing about where users live.

   Seeded accounts, not a database. Swapping in MongoDB Atlas means rewriting
   findUser() as `users.findOne({ email })`; api/login.js does not change, and
   neither does the sign-in screen.

   Only bcrypt hashes are stored here — never plaintext. The passwords are
   published on the sign-in screen because this is a judged demo and judges need
   to log in; they are NOT real credentials and must never be reused elsewhere. */

const bcrypt = require('bcryptjs');

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

async function findUser(email){
  const e = normalize(email);
  if (!e) return null;
  return SEED.find(u => u.email === e) || null;
}

/* Always runs a comparison, even when the user does not exist. Returns whether the
   credentials are good; the caller decides what to say, so a failed login cannot
   distinguish "no such account" from "wrong password" in either body or timing. */
async function verifyPassword(user, password){
  const hash = user ? user.hash : DUMMY_HASH;
  const ok = await bcrypt.compare(String(password || ''), hash);
  return !!user && ok;
}

module.exports = { findUser, verifyPassword, DUMMY_HASH };
