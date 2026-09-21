# BayouCare — Target Users and User Journeys

Who this is for, what each user actually does today, and what is deliberately not built yet.

Every claim below was checked against the code on `main`. Where the pitch describes something
the build does not have, this document says so rather than implying it works. The app's own
footer carries the same warning: *Demo data only — not for clinical use.*

---

## 1. Who it is for

**The primary user is one person: a Louisiana cancer patient, from diagnosis through treatment
and into survivorship.**

The product is built around that person, and the code reflects it in three ways:

- **Patient mode is the default.** It is the initial mode of the UI store, it is the mode
  `resetStores()` returns to, and it is the mode every non-clinician sign-in is set to.
- **The patient surface is the deep one.** Nine sections inside My Care plus a survivorship
  plan, against five clinician tabs.
- **A patient account is bound to its own record, server-side.** `GET /api/patient` resolves the
  signed-in account to one patient; the patient app reads that record and nothing else.

### The three users

| | Account today | What they get |
|---|---|---|
| **Patient** (primary) | Yes — four demo patient accounts | The nine My Care sections, My Plan, Remi |
| **Caregiver / family member** | **None.** They use the patient's sign-in | Whatever the patient's sign-in shows, plus a "Caregiver mode" checkbox |
| **Clinician** | Yes — one demo clinician account | Admin mode: five tabs; can switch to Patient mode |

**Patient — can:** see their diagnosis in plain language, their roadmap, their appointments
(book, reschedule, cancel, restore), their check-ins and device readings, rides and financial
help, trials, and Remi. Every screen reads their own record.

**Patient — cannot:** message their care team (the button is real but nothing is wired behind
it), and no data they enter leaves the browser — a check-in, a booking, or a help request is
held in the app, not sent anywhere.

**Caregiver / family member — can:** look at everything the patient can, because they are
signed in as the patient.

**Caregiver / family member — cannot:** sign in as themselves. There is no caregiver account,
no second profile, and no way to tell the app "I am the daughter, not the patient." The
"Caregiver mode" checkbox in the sidebar only swaps a line of explanatory text; the source
comment is explicit that it is *"presentation only… not an access control and never was."*
The pitch copy describes a caregiver hub with a second profile — that is the target state, not
the build. See §3 for what a family member actually gets today.

**Clinician — can:** sign in, land in Admin mode, work the five admin tabs, and flip to Patient
mode to see the patient app. The mode switch renders **only** for the clinician role, and the
admin tabs are filtered out of a patient's navigation — so a patient never sees a door to the
clinician view.

**Clinician — cannot:** choose which patient's app they are looking at (see §4), write anything
back to an EHR, message a patient, or change a schedule. The admin surfaces read the same
synthetic record set the patient app does.

---

## 2. The patient journey — the nine sections of My Care

The order below is the order of the sidebar, and it is close to the order a patient moves
through care. Each entry says what the section is *for*, not what it contains.

The patient lands on **Home** (the overview page: what BayouCare is, the Louisiana numbers, the
six-stage journey, an evaluator panel folded away at the bottom). Their work happens in **My
Care**; their survivorship plan lives in **My Plan**.

**1. Home — "what matters today."**
A greeting bound to the patient's own record, the next appointment and whether a ride is
already arranged for it, the care team with roles, and the family circle's shared task list.
A patient opens this to answer one question: what is next, and who is helping. They leave
knowing the next date without hunting for it.

**2. Appointments — "when, and can I change it."**
A month calendar with the patient's appointment types colour-coded, full and closed days
marked, and a day agenda underneath. From here a patient books, reschedules, cancels (and
undoes a cancellation), and sees which visits have a ride attached. This is the section the
semi-final feedback asked for. A patient opens it to confirm a date; they leave having changed
one if it needed changing.

**3. Screen & Prevent — "should I be screened, and when."**
Three calculators — lung (USPSTF 2021 LDCT eligibility), breast (family-history based), and
colorectal (family-history-adjusted start age) — plus the resulting screening plan, nearby
community screening events, and a Quit-to-Screen bundle that refers to the LA Quitline when
smoking is in the picture. A patient opens it because a relative was diagnosed, or because
they are 50 and have never been screened. They leave with a start age and a next date.

**4. My Journey — "where am I in this."**
A six-step timeline (diagnosis explained → treatment plan set → surgery → chemotherapy cycle 1
of 6 → radiation planning → survivorship clinic) with completed, current, and upcoming steps
distinguished. A patient opens it on a bad day to see that this is a course with an end, not an
open-ended emergency. *Honest note: the six steps are a fixed template drawn from the app's
translated dictionary, not generated from the patient's record — every demo patient sees the
same six steps.*

**5. Understand — "what did the report actually say."**
A plain-language explanation of the diagnosis, the receptor/grade language that frightens
people, and four questions to ask at the next visit. A patient opens it the week the pathology
report lands. They leave with questions written down. *Honest notes: the opening dialogue is a
worked example of the assistant, not a live chat — the real assistant is Remi, on its own
screen. The explainer body is written for one breast-cancer record and is not yet generated per
patient; the speaker's name is bound to the record, the clinical text is not.* The screen states
plainly that it simplifies reports for understanding and never replaces clinical advice.

**6. Check-ins — "someone is watching between visits."**
Four scored questions (energy, nausea, fever, pain) plus three optional mood questions, a
rolling five-day trend, and a short "what BayouCare sees" summary that names the one thing that
mattered. A patient opens it nightly because the gap between infusions is when things go wrong
unnoticed. A fever answer raises a red-flag message with the 100.4°F threshold and the promise
of a call. The mood block carries the crisis path in-line: call or text 988, free, 24/7.
*Honest note: the check-in is stored in the app and the summary is generated from the answers
locally; no message is actually transmitted.*

**7. Vitals — "the 2 a.m. blind spot."**
A live temperature patch reading and a scale reading, plus a replay of the previous night that
ends, if the simulated fever crosses threshold, in an auto-escalation and a caregiver SMS. A
patient opens it to show a family member what the device sees. The replay's output is real
within the app: it lands on the clinician's Care Team tab as an escalated alert (§4).

**8. Access & Help — "the barriers that are not medical."**
Rides (with the transport provider named), mileage reimbursement, lodging near treatment,
telehealth that states it works on slow connections, copay assistance and Medicaid navigation,
a local support group, and a help request to the named social worker. TrialMatch below it
pre-checks real NCT trials against the patient's profile, criterion by criterion, with the
reasons shown. A patient opens this when the problem is the 92-mile round trip, not the tumor.

**9. Ask Remi — "a question at 11 p.m."**
The assistant answers from the patient's own record — diagnosis, plan, next appointment, how
they have been feeling, device readings, rides, costs, who is on the team. It answers
**on-device by default**, with no key and no network; if the patient pastes their own API key it
uses a live model instead, and falls back to the on-device answer if anything fails. It does not
give clinical advice: questions about medication, doses, or symptoms are routed to the care
team with the oncologist's and navigator's names, an emergency description is met with "call
your care team now, or 911" and no reassurance, and any mention of self-harm leads with **988**
and a statement that the care team is being told. A patient opens it instead of googling at
midnight, and leaves with a phone number rather than a guess.

**My Plan** (top navigation, outside My Care) is the patient's own survivorship care plan: what
treatment involved, what to keep an eye on, and why. A patient still in active treatment is told
exactly that — the plan is written at the survivorship clinic visit — rather than being shown a
stranger's chart. It prints for real; the "share with family" control is a demo simulation.

---

## 3. The caregiver / family journey, as it exists today

Today, a family member **signs in with the patient's credentials**. There is no caregiver
account, and the app has no concept of a second person attached to a record.

What a family member actually gets, in the build:

- The **family circle card on Home** — shared tasks with their state (open, in progress, done),
  which is the one place in the app where care work is visibly split between people.
- The **family screening card** on Screen & Prevent, which speaks to the caregiver about the
  patient's children and their own screening start age.
- **My Journey**, whose subtitle promises that family members see the same map.
- The **caregiver SMS** card in the Vitals replay — the escalation that reaches the person who
  is not in the room.
- **"Share with family"** on My Plan.

What does not exist, and should not be implied in a demo: a caregiver login, separate
notifications, task assignment, or any way to represent two people with different permissions.
The "Caregiver mode" checkbox is a label, not a role.

---

## 4. The clinician journey — Admin mode

The clinician signs in and lands in Admin mode. The mode switch in the top bar appears only for
this role, and the tabs are:

**Care Team** — the risk worklist. Every patient carries a 7-day forecast with the one action
that changes it; applying an action re-runs the model live and moves the intervention board.
This is also where device-vitals alerts arrive: run the 2 a.m. replay in the patient app and
the fever shows up here, already escalated. The auto-drafted visit summary is a fixed sample
rather than a generator, and the time-saved figures beside it are demo placeholders for a pilot
that has not run yet.

**Clinic Ops** — the five administrative workflows that decide whether a patient is actually
treated: prior-authorization packets, tumor-board prep, referrals, PCP decision support, and the
no-show/slot board. Every risk number here is read from the same engine the Care Team tab and
the patient's own calculators use, not recomputed — the patient's screening numbers and the
PCP's decision-support card are the same numbers by construction.

**Survivorship** — ASCO-format care plans generated from a treatment record (summary, follow-up
schedule, PCP handoff letter) plus the late-effects radar that turns a drug and radiation
history into a surveillance calendar. The clinician picks the survivor from here; deliberately,
that choice does **not** change what the patient sees on their own plan.

**Population** — the 64-parish heat index, ranked by unmet need, in tile and geographic views,
with the screening-van tour, the abnormal-result follow-up queue, and FIT-kit return tracking.

**Roadmap** — the build and pilot plan, the ASCO alignment, and the team.

**Why this is a lens and not a second product:** Admin mode reads the same stores, the same
records, and the same engines as the patient app — the fever on the Care Team worklist is the
fever the patient's patch reported — so it stays as a clinician-only view of one shared system
rather than a parallel app, and Patient mode remains what the product opens on.

**What the clinician cannot do:** choose which patient's app they are viewing. The store has a
`setPatient` action and the top-bar comment describes a role-keyed patient picker, but no picker
is built and the action is never called — a clinician in Patient mode sees the default demo
record. There is also no EHR write-back, no messaging, and no scheduling. And the separation is
a **UI-level lens, not a security boundary**: the mode switch is hidden from patients and the
tabs are filtered, but routes are not guarded by role, so a signed-in patient who knows the URL
can still reach an admin screen.

---

## 5. Deliberately out of scope, and what comes next

Out of scope for this prototype, stated rather than hidden:

- **No caregiver account.** Family members use the patient's sign-in (§3).
- **No patient picker for clinicians**, so Patient mode always opens the default record.
- **No role guard on routes.** Access control is the hidden switch and the filtered tabs.
- **Nothing leaves the browser.** Check-ins, bookings, help requests, referrals, and shares are
  demo-simulated; the trials list is the one live external call (clinicaltrials.gov, with a
  bundled snapshot fallback), and Remi's live model is optional and key-held by the user.
- **No messaging backend, no EHR integration, no SMS, no ride booking.** Where a control cannot
  do the thing, it says so rather than pretending.
- **No offline mode or SMS fallback.** The pitch names them as design goals; nothing is built —
  there is no service worker.
- **Provider ROI is illustrative.** The Admin mode numbers are demo placeholders, not measured
  outcomes.
- **Four languages, incomplete dictionaries.** Spanish, Haitian Creole, and Vietnamese are
  live in the patient app but carry missing keys that fall back to English; the clinician
  surfaces are English-only by design, as clinical systems are.
- **The screening calculators implement guideline rules with in-app disclaimers** — the lung
  figure is labelled a demo approximation of PLCOm2012, the breast model is explicitly not
  Tyrer-Cuzick. They are not validated risk models.
- **All data is synthetic**, and the app says so on every screen it matters on.

What comes next is on the Roadmap screen: field interviews with patients, caregivers, and
oncology staff; validation of the journey map with navigators; then a two-clinic pilot measuring
treatment-start delay, check-in adherence, and clinician admin time against baseline.
