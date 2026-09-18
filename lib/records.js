/* Seed data for the identity layer: which patients exist, and who can sign in as whom.

   Deliberately ONLY the roster — id, display name, MRN, city, and a short stage label.
   The clinical content is NOT stored here, and there is no `record` column in the
   database. That follows from the decision this work was scoped around: per-patient
   records here mean identity binding, not an access-control boundary, so the chart ships
   with the app. Keeping a second copy in Postgres would buy nothing and create a way for
   the two to disagree — exactly the drift the plan warned about.

   Consequence worth stating plainly: index.html's PATIENTS registry is the RENDER source
   and this file is the IDENTITY source. They are two halves of one dataset and have to be
   edited together. /api/patient returns these fields so the test suite can assert the two
   actually agree (see the agreement check in patients.js) rather than trusting it.

   The roster lists patients; the login card lists accounts. They are different lists on
   purpose — the switcher should show a real population without the card growing a button
   per patient. */

const PATIENTS = [
  {id:'darlene',   name:'Darlene Fontenot',  mrn:'44012', city:'Alexandria',    dx:'Stage II breast · Cycle 1'},
  {id:'priscilla', name:'Priscilla Comeaux', mrn:'44038', city:'Breaux Bridge', dx:'Stage III lung · Cycle 2'},
  {id:'yolanda',   name:'Yolanda Price',     mrn:'44019', city:'Alexandria',    dx:'Breast · survivorship'},
  {id:'marcus',    name:'Marcus Thibodeaux', mrn:'44021', city:'Monroe',        dx:'Lymphoma · survivorship'}
];

/* Accounts beyond the two originals in lib/users.js. Those two keep their literal hashes
   so the passwords published on the sign-in screen stay byte-identical; these three are
   hashed at seed time with the same convention. Plaintext lives here only because the
   passwords are printed on the login card for judges — they are not real credentials. */
const NEW_ACCOUNTS = [
  {id:'u_priscilla', email:'priscilla@bayoucare.demo', role:'patient', pid:'priscilla', password:'priscilla2026'},
  {id:'u_yolanda',   email:'yolanda@bayoucare.demo',   role:'patient', pid:'yolanda',   password:'yolanda2026'},
  {id:'u_marcus',    email:'marcus@bayoucare.demo',    role:'patient', pid:'marcus',    password:'marcus2026'}
];

/* Which legacy account owns which patient, and that the clinician owns none. */
const LEGACY_PIDS = { 'u_patient': 'darlene', 'u_clinician': null };

module.exports = { PATIENTS, NEW_ACCOUNTS, LEGACY_PIDS };
