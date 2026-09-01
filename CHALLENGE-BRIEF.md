# DevDays Cancer Care & Prevention Challenge — Brief & Insights

> Compiled from scraping nexusla.org (healthcare-challenges, programs/devdays, challenge-areas, winner articles, solution pages) — August 11, 2026.

## The Challenge

**Partner:** Ochsner Health (via Nexus Louisiana DevDays)

> "Design an innovative solution that improves the cancer care journey for patients and caregivers, from diagnosis through treatment, survivorship, and supportive care."

### Official potential solution areas (pick 1+; a strong entry usually covers a connected set)
1. **AI-powered patient navigation tools** — understanding the diagnosis, coordinating appointments, accessing resources
2. **Predictive analytics and remote monitoring** — identify at-risk patients, enable earlier intervention
3. **Digital platforms connecting patients, caregivers, and care teams**
4. **Solutions improving access to care in rural/underserved communities** — telehealth, virtual support, transportation assistance
5. **AI-enabled tools reducing administrative burden on oncology teams**

### Deadlines
| Milestone | Date |
|---|---|
| Sign up & **submit draft prototype** | **August 23, 11:59 pm** |
| Virtual semi-finals | August 26–27 |
| Finalists notified | August 31 |
| Finals (live demo) | September 25, 11:30 am–5:00 pm, Nexus LA |

### Prizes & structure
- Top 10 teams compete for **$10,000 total cash prizes**
- 12-week competition → one-day live demo; semi-finals are virtual
- Past winners got $5,000 + visibility + industry access

### Eligibility
- Current engineering, CS, or business students at a 4-year Louisiana university
- OR graduates of those programs within the last 12 months

## What winning solutions look like (from past winners)

**Kneva** (won DevDays HealthTech, $5,000 — ULM CS students):
- Crystal-clear problem statement: female athletes 8× more likely to get ACL injuries, but all prevention tools built on male physiology
- Named platform + polished one-pager (Problem → Solution → How it works → Team)
- Real innovation (wearable sensor + hormonal data) but the *story* carried the pitch
- All-female team, faculty advisor, strong quotes in press coverage

**Takeaways for us:**
- Judges want **problem → gap → Louisiana-specific solution → demo**. Story structure matters as much as tech.
- The pitch page/README is part of the submission. Alignment with the official solution areas is explicit.
- A working interactive prototype >> slides. Semi-finals are virtual, finals are live — both favor a demo-able prototype.

## Louisiana cancer burden (grounding data for the pitch)

Sources: American Cancer Society 2025 estimates (via USA Today coverage of ACS data).

- **~29,980 new cancer cases** and **~9,340 cancer deaths** expected in Louisiana in 2025
- **Incidence: 496.1 per 100,000** vs 445–455 national — among the highest in the US
- **Mortality: 165.2 per 100,000** vs 146.0 national — higher than national average
- Leading cancers: prostate, breast, lung, colorectal, kidney (incidence); lung, breast, prostate, colorectal, pancreas (mortality)
- Contributing structural factors: rural healthcare deserts, chronic disease burden, workforce shortages, late-stage diagnosis in underserved communities

## Site context (what Nexus LA is)

- Three challenge areas: Healthcare, Environment, Education
- Healthcare page: Prevention & Treatment / Accessibility / Workforce Shortages
- Programs: DevDays (student competition), Tech Cup (startup), Tech Tailgates
- Solutions Map showcases winner solutions publicly — winning gets you on the map
- Contact: hello@nexusla.org · (225) 218-1100 · 7117 Florida Blvd, Baton Rouge

## Suggested concept directions

1. **AI patient navigator** — plain-language diagnosis explainer + personalized next-step checklist (area 1, 3)
2. **Rural access platform** — telehealth + transportation + resource finder (area 4)
3. **Caregiver hub** — shared journey timeline, task coordination (area 3)
4. **Check-in / remote monitoring** — symptom tracking with escalation alerts to care team (area 2)
5. **Oncology admin copilot** — auto-generated visit summaries, flag lists (area 5)
6. **Screening / prevention module** — the track name is "Cancer Care **& Prevention**"; a personalized screening-reminder module (breast/colorectal/lung, community screening events) covers the prevention half explicitly

The prototype in this folder (**BayouCare**) combines 1–6 as a connected "cancer care journey" platform with a caregiver mode and a care-team dashboard — the 12-week build can deepen any one module.

---

# ROUND 2 — Full link sweep (Aug 12)

## Official data & insights page — `/programs/devdays-edtech-data`

- **Data partner: ASCO — the American Society of Clinical Oncology** (501(c)(3), "dedicated to conquering cancer through research, education, and the promotion of high-quality patient care")
- The page links "View Data" → https://www.asco.org/about-asco/asco-overview (returns 403 to scrapers; browse in a browser or use ASCO's public resources: ASCO Answers patient education, ASCO quality measures, CancerLinQ)
- Page title is "DevDays EdTech Data and Insights" (template mismatch on the live page — the actual content is the Cancer Care challenge, so don't be confused)
- A "200" statistic is displayed with lorem-ipsum label (placeholder — likely for an impact stat; don't rely on it)
- Deadline restated: **"The deadline to sign up and submit the project is Sunday, August 23 at 11:59 pm"**

## Video — "DevDays HealthTech: Cancer Care and Prevention" (youtu.be/h9EmBE5ZXIg)

- Published by **Nexus Louisiana** (youtube.com/@nexuslouisiana); labelled on the DevDays page as "Hear From Ochsner Health"
- Content: Ochsner Health leaders framing the challenge; the challenge details it references match the DevDays page text captured above
- (YouTube blocks full description extraction by scrapers; the title/metadata above is confirmed via YouTube's oEmbed API)

## Registration form — JotForm 2619479549 ("DevDays Interest Form")

- **Every team member must register individually** — "All team members should complete the signup individually"
- Required fields: first/last name, email, phone, city, state, **university**, **department**, **classification** (Freshman–Postgraduate), how you plan to participate (has team / idea but no team / solo), **faculty advisor** (yes / no-need-assistance / no-find-independently), **anticipated graduation year** (2026–2031+), college major, hometown, how you heard about DevDays
- Registration unlocks "important updates, key deadlines, and resources" by email
- Note: signup ≠ submission. The draft prototype itself is due Aug 23 too.

## DevDays format (from news coverage of the 2025 event)

- ~**10-minute presentation with live tech demo** to a panel of judges (reimagined pitch-event format)
- Judges see: problem framing → solution → working demo → Louisiana relevance
- Future DevDays themes mentioned: cancer detection, obesity, insurance rates, childhood literacy — prevention-adjacent themes are on their radar

## Verbatim barriers named in the challenge brief

> "delays in diagnosis, difficulty navigating complex treatment plans, managing side effects, accessing supportive services, and overcoming transportation, financial, and geographic barriers to care" — **amplified in rural and underserved communities**

## Coverage checklist — every brief item → prototype feature

| Named in the brief | BayouCare feature |
|---|---|
| Delays in diagnosis | Screen & Prevent module — screening reminders, community events, early-detection education |
| Navigating complex treatment plans | My Journey roadmap + Understand AI explainer |
| Managing side effects | Daily check-ins with automatic escalation |
| Accessing supportive services | Resource finder (financial aid, groups, trials, social work) |
| Transportation, financial, geographic barriers | Access Hub — rides, mileage, lodging, low-bandwidth telehealth |
| Amplified in rural/underserved communities | Offline-first, SMS fallback, EN+ES, Alexandria/Baton Rouge validation |
| Data partner: ASCO | Screening per ASCO/ACS guidelines; education per ASCO standards; outcomes vs ASCO quality measures |
| "Cancer Care **and Prevention**" track | Screen & Prevent module covers the prevention half explicitly |

**Prototype status:** all rows above are implemented in index.html as of Aug 12.
