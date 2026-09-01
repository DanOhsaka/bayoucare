# BayouCare — Project Description (DevDays 2026 · Cancer Care & Prevention)

## One-liner
BayouCare is an AI-powered cancer care navigation platform that walks Louisiana patients and caregivers from prevention through diagnosis, treatment, and survivorship — with risk-stratified screening, counterfactual risk forecasts, auto-generated survivorship care plans, and a parish-level heat index that routes care to the communities that need it most.

---

## Short description (~200 words — submission form)

Louisiana faces one of the nation's worst cancer burdens — incidence 496.1/100,000 and mortality 165.2/100,000, both above the US average — driven by late-stage diagnoses in rural parishes where patients navigate a fragmented system alone: no roadmap, no transport, no support network in reach.

BayouCare answers every solution area in the brief with one connected, low-bandwidth platform:

- **AI patient navigation** — plain-language diagnosis explainer and a personalized journey roadmap
- **Predictive analytics & remote monitoring** — daily symptom check-ins feed a transparent risk model that forecasts 7-day risk for every patient, each forecast shipping with a counterfactual prescription ("if we arrange daily ANC monitoring at home, her risk drops 58% → 37%")
- **Connecting patients, caregivers & care teams** — one shared journey timeline with a caregiver mode
- **Rural & underserved access** — telehealth, ride coordination, a curated resource finder, English + Spanish, offline-first design
- **AI reducing admin burden** — auto-drafted visit summaries and a risk-triage worklist

Prevention and survivorship are first-class citizens: risk-stratified screening calculators (USPSTF 2021 lung LDCT with a Quit-to-Screen bundle wired to the LA Quitline, breast, colorectal), auto-generated ASCO-format survivorship care plans with a late-effects radar, and a 64-parish heat index — tile and geographic views — that routes screening vans and SMS nudges by unmet need, not city size. Built on ASCO (the challenge's official data partner) standards; the working prototype is a single self-contained file, demoable end-to-end on synthetic data.

---

## Long description (~450 words — pitch page / README)

### The problem
Louisiana will see ~29,980 new cancer cases and ~9,340 cancer deaths this year. We find cancer late: mortality runs 165.2 per 100,000 against a 146.0 national average, and 64 mostly-rural parishes mean specialists, transport, and support are often hours away. The challenge brief names the barriers — delays in diagnosis, navigating complex treatment plans, managing side effects, accessing supportive services, and transportation, financial, and geographic barriers — and every one of them is amplified in rural and underserved communities.

### The gap
National apps assume broadband, specialists down the street, and insurance literacy. In Louisiana, telehealth is unreliable, rides are someone else's problem, and no app connects the patient, their family, and the care team across the whole journey. Cancer navigation is the #1 gap named in the brief — and no national product is built for how Louisiana actually lives.

### The solution — BayouCare
One platform that walks patients and caregivers from **prevent → diagnose → plan → treat → survive → support**, built Louisiana-first:

**Prevention that targets, not reminds.** Risk-stratified screening calculators (lung LDCT per USPSTF 2021 with a Quit-to-Screen bundle that refers directly to the LA Quitline; breast with BRCA signals; colorectal with family-history-adjusted start ages) turn generic reminders into a personal screening plan. A **parish heat index** — all 64 parishes as a tile cartogram and a true geographic map — ranks communities by unmet need (unscreened rate × late-stage share), so screening vans and SMS nudges go where the burden is, not where the city is.

**Care that predicts, not just reacts.** Daily symptom check-ins feed a transparent logistic risk model. Every patient on the care-team dashboard carries a 7-day risk forecast with a **counterfactual prescription — the one action that changes the outcome** ("arrange rides → 45% → 30%; daily ANC watch → 58% → 37%"). Apply it and the model re-runs live; an intervention board shows what moves the needle across the whole cohort.

**Survivorship as a product, not a footnote.** ~350,000 Louisianans are cancer survivors — the largest population the brief names. BayouCare auto-generates ASCO-format **survivorship care plans** from the treatment record (treatment summary, follow-up schedule, PCP handoff letter) and a **late-effects radar** that turns "doxorubicin + chest radiation" into a concrete echo/MRI/DXA surveillance calendar — with overdue items flagged for the clinic.

**One shared journey.** Patients get a living roadmap and plain-language explainers; caregivers get a second profile; clinicians get auto-drafted visit summaries and a risk-triage worklist — cutting inbox time so they can spend it on patients.

### Why it wins
It's the only entry that connects the brief's five solution areas into one demoable journey — and every module runs on synthetic data in a single file, no server, no broadband required. Built on the challenge's official data partner (ASCO) and on Louisiana's own numbers, by Louisiana students, for Louisiana patients.

*Working prototype: a single self-contained HTML file. Care-team forecasts, SCP generator, screening calculators, and both parish maps are live and demoable today.*
