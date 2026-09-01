# Competitor Idea Pool — Simulated Brainstorm

> Six independent "competitor teams" brainstormed against the DevDays Cancer Care & Prevention brief
> (with BayouCare's current feature set as the baseline to beat). Compiled & ranked Aug 12, 2026.

---

## The 6 simulated competitors

| # | Team persona | Angle | Product |
|---|---|---|---|
| 1 | **SIGNAL** (CS/Math) | Predictive analytics & ML | Oncology risk engine — forecasts failures before they happen |
| 2 | **Lagniappe** (Business/Policy) | Community + social determinants | CHW networks, churches, rides, benefits — "relationships, not dashboards" |
| 3 | **OncoFlow** (CS/Pre-med) | Provider workflow / EHR | Referral, prior-auth, trial-matching, tumor-board automation |
| 4 | **FirstCheck LA** (Public Health/CS) | Prevention-first, risk-stratified | Guideline-based risk engines + parish-level data heat map |
| 5 | **VitalSweep** (Engineering) | Hardware remote monitoring | Cellular at-home vitals kit + rural telehealth cart |
| 6 | **SecondLine** (Psych/CS) | Survivorship & supportive care | ASCO survivorship plans, late-effects radar, mental health |

---

## Master idea pool (all features from all teams)

### SIGNAL — the predictive engine
1. **Hospitalization / neutropenic-fever early warning** — CBC trend features (ANC slope), chemo regimen, prior admissions, SDOH → 7-day inpatient risk flag with SHAP explanations. *(Innov 5 / Build 4)*
2. **Treatment-interruption predictor** — flags who will miss doses before cycle start (prior delays, distance-to-site, instability factors). *(Innov 4 / Build 4)*
3. **No-show model + smart rebooking** — per-slot no-show probability feeding an optimizer that protects slots for high-risk patients with timed SMS nudges. *(Innov 4 / Build 3)*
4. **Late-stage diagnosis risk at primary care** — claims/Medicaid screening-eligibility scoring (no colonoscopy in 10 yrs, smoking proxies, rural parish + SVI) to target outreach. *(Innov 4 / Build 5)*
5. **Wearable early-toxicity detection** — HealthKit/Fitbit HR/HRV/sleep anomalies flag toxicity windows before patients report symptoms. *(Innov 4 / Build 3)*
6. **NLP adverse-event miner** — extracts toxicity mentions from unstructured clinical notes. *(Innov 4 / Build 4)*
7. **Counterfactual intervention board** — every prediction ships with "if we arrange transport, no-show risk drops 22%; if we watch ANC daily, admission risk drops 15%." *(Innov 5 / Build 3)*

### Lagniappe — community & SDOH
8. **CHW Console** — mobile worklist for community health workers (rosters, notes, follow-ups). *(Innov 4 / Build 2)*
9. **PRAPARE SDOH screening** — standardized social-needs screen auto-mapped to United Way 2-1-1, LIHEAP, SNAP, Feeding Louisiana. *(Innov 4 / Build 3)*
10. **Kreyòl + Tiếng Việt + EN/ES outreach** — SMS/WhatsApp in all four Louisiana languages with human escalation to in-language CHWs. *(Innov 4 / Build 3)*
11. **Ministry Toolkit** — playbook + booking for church health ministries to host screening events. *(Innov 5 / Build 3)*
12. **Mobile screening event ops ("On the Road")** — van/volunteer scheduling + 14-day abnormal-result follow-up queue. *(Innov 4 / Build 4)*
13. **Pile-In Rides** — vetted volunteer drivers bridged to Medicaid NEMT (Modivcare) + 2-1-1. *(Innov 3 / Build 4)*
14. **Benefits Concierge** — document-assist for SNAP/LIHEAP/charity care. *(Innov 4 / Build 3)*
15. **Village Circle** — caregiver + community circle: ride calendar, meal-train hooks. *(Innov 3 / Build 3)*

### OncoFlow — provider workflow
16. **Referral Express** — SMART-on-FHIR app inside rural PCP's EHR: 1-click referral with bundled labs/pathology to oncology, tracked status end-to-end. *(Innov 5 / Build 3)*
17. **Prior-Auth Autopilot** — auto-drafts payer authorizations with clinical justification from the chart. *(Innov 4 / Build 4)*
18. **TrialMatch Engine** — ClinicalTrials.gov v2 API eligibility matching against patient profile (ICD-10, LOINC biomarkers, prior lines). *(Innov 5 / Build 4)*
19. **Tumor-Board Prep Engine** — FHIR reports → LLM case summary with AJCC stage and open questions. *(Innov 5 / Build 4)*
20. **Inbox Triage AI** — classifies portal message urgency, auto-drafts replies. *(Innov 4 / Build 3)*
21. **AutoNotes + discharge summaries** — ambient documentation. *(Innov 4 / Build 3)*
22. **Capacity Command Center** — live panel of treatment loads, no-show risk, staffing bottlenecks. *(Innov 4 / Build 3)*

### FirstCheck LA — prevention-first
23. **Lung Risk Engine (LDCT)** — USPSTF 2021 criteria + PLCOm2012/Bach risk models; targets sub-threshold high-risk smokers. *(Innov 5 / Build 3)*
24. **Tyrer-Cuzick / hereditary flags** — 5-min family history → breast risk score, BRCA signals, genetic-counseling referral. *(Innov 4 / Build 3)*
25. **HPV shot nudges** — back-to-school campaigns for parents of 11–12-year-olds (LA HPV coverage trails the US). *(Innov 4 / Build 3)*
26. **Quit-to-Screen bundle** — LA Quitline referral + NRT guidance wired to lung-screening eligibility. *(Innov 5 / Build 3)*
27. **Parish Heat Index** — LA Tumor Registry + BRFSS per-parish risk map routing screening vans to the highest-burden 64 rural parishes. *(Innov 4 / Build 4)*
28. **PCP risk feed (CDS)** — FHIR alert in the EMR: "Patient due for LDCT, PLCOm2012 risk 4.1%." *(Innov 5 / Build 5)*
29. **FIT kit adherence loop** — mailed stool kits with return tracking and text nudges. *(Innov 3 / Build 2)*
30. **Drive Logistics Ops** — end-to-end employer/church screening drive tooling. *(Innov 3 / Build 4)*

### VitalSweep — hardware monitoring
31. **NeutroSweep temp patch** — continuous skin temp catches neutropenic fever (often 2 am, hours from a hospital). *(Innov 5 / Build 5)*
32. **WeightTrend smart scale** — >5% loss/30 days flags cachexia; gain flags fluid retention. *(Innov 3 / Build 3)*
33. **RuralLink cellular hub** — LTE-M/NB-IoT streaming (no WiFi dependency, deep-indoor penetration). *(Innov 4 / Build 4)*
34. **Morning Sweep dashboard** — one objective-vitals view per patient for nurse navigators. *(Innov 4 / Build 3)*
35. **Auto-escalation engine** — threshold + trend triggers route to RN + caregiver SMS without patient action. *(Innov 4 / Build 3)*
36. **ClinicLink telehealth cart** — rolling cart for rural clinics lacking telehealth gear. *(Innov 4 / Build 5)*
37. **Offline-first burst sync + caregiver objective view** — devices buffer 7 days locally. *(Innov 3 / Build 3)*

### SecondLine — survivorship & supportive care
38. **Living Survivorship Care Plan** — ASCO-mandated SCP auto-generated from treatment summary + PCP handoff letter. *(Innov 5 / Build 4)*
39. **Late-Effects Radar** — treatment → risk rules (doxorubicin → echo surveillance; chest radiation → secondary-cancer screening; mastectomy → lymphedema checks). *(Innov 4 / Build 3)*
40. **Mood Check & 988 escalation** — PHQ-9/GAD-7 lite → self-care / NAMI Louisiana referral / 988 crisis escalation. *(Innov 4 / Build 3)*
41. **Second-Line Peer Match** — survivor-to-survivor mentor matching by diagnosis, treatment era, parish. *(Innov 4 / Build 3)*
42. **Return-to-Work & Money Concierge** — disability/SSA claim tracker, accommodation-letter templates, LA 211. *(Innov 4 / Build 4)*
43. **Oncofertility Compass** — pre-treatment fertility preservation checklist. *(Innov 4 / Build 3)*
44. **Rehab & Exercise Concierge** — oncology PT/lymphedema + 12-week walk program. *(Innov 3 / Build 3)*
45. **Caregiver Burnout Guard** — Zarit burden scale + respite finder. *(Innov 3 / Build 2)*

---

## Ranking — best to least innovative (with verdict for BayouCare)

**Legend:** Innov = originality/sophistication (10 = nobody else will have it) · Fit = alignment with the 5 official solution areas · Build = 12-week feasibility (lower = easier)

### 🥇 TIER 1 — ADD TO BAYOUCARE (high innovation, high fit, demoable)

| Rank | Idea (origin) | Innov | Fit | Build | Verdict for BayouCare |
|---|---|---|---|---|---|
| 1 | **Counterfactual risk predictions** — every flag ships with "the one action that changes the outcome" (SIGNAL) | 10 | 2,5 | 3/5 | **Add.** Upgrades the care-team dashboard from *reactive summaries* to *forecasts with a prescription*. Demo on synthetic patient data; the "why + what action" framing is the single most judge-memorable differentiator in the entire pool. |
| 2 | **Survivorship Care Plan generator + Late-Effects Radar** (SecondLine) | 9 | 1,3 | 3/5 | **Add.** The brief explicitly names survivorship — your current app treats it as one timeline stop. Auto-generating an ASCO-format SCP from a mock treatment summary is a concrete artifact judges can hold; late-effects rules (echo after doxorubicin, breast MRI after chest radiation) are simple lookup tables. |
| 3 | **Risk-stratified screening** — PLCOm2012 lung, Tyrer-Cuzick breast, Quit-to-Screen (FirstCheck LA) | 9 | 1,4 | 3/5 | **Add.** Your Screen & Prevent module is generic reminders; this makes it *targeted outreach*. Risk calculators are off-the-shelf; Quit-to-Screen ties in LA Quitline. Cite USPSTF 2021 + LA Tumor Registry for rigor. |
| 4 | **Parish Heat Index** — parish-level risk map (FirstCheck LA) | 8 | 4 | 4/5 | **Add as a pitch moment.** A live map of LA Tumor Registry incidence per parish makes the demo *feel* Louisiana. Even a static mockup on the Overview page is a wow slide. |

### 🥈 TIER 2 — ADD IF CAPACITY (strong, but watch scope)

| Rank | Idea (origin) | Innov | Fit | Build | Verdict for BayouCare |
|---|---|---|---|---|---|
| 5 | **Clinical trial matching** — ClinicalTrials.gov v2 API eligibility engine (OncoFlow) | 9 | 1,3 | 3/5 | **Add if time allows.** Real API + real NCT IDs in the demo = zero mock data. The strongest single OncoFlow feature; it's patient-facing enough to belong in your app (Access Hub → "Trials near you" with eligibility pre-check is already a stub — this fills it for real). |
| 6 | **Objective vitals bridge** — commercial devices (temp patch, scale) → same escalation engine (VitalSweep) | 8 | 2 | 3/5 | **Add selectively.** Don't build hardware. Integrate off-the-shelf devices (BLE thermometer/scale) into the existing check-in/escalation flow — demonstrates fixing the "2 am neutropenic fever" blind spot and answers the "self-reported only" attack. |
| 7 | **Kreyòl + Tiếng Việt language support** (Lagniappe) | 7 | 4 | 2/5 | **Add.** Cheap (a toggle + a few strings + a "coming soon" chip). Louisiana's most underserved language communities are Creole and Vietnamese — every simulated team flagged your EN/ES-only as a weakness. |
| 8 | **Mood Check + 988/NAMI LA escalation** (SecondLine) | 7 | 1,3 | 3/5 | **Add.** Lightweight PHQ-9-lite check-in with real LA escalation paths (988, NAMI Louisiana). Fits naturally beside the daily check-in. |

### 🥉 TIER 3 — DEFER OR USE AS PITCH MATERIAL ONLY

| Rank | Idea (origin) | Innov | Fit | Build | Why not now |
|---|---|---|---|---|---|
| 9 | No-show model + smart rebooking (SIGNAL) | 7 | 2,5 | 4/5 | Needs appointment data access; keep as a roadmap slide. |
| 10 | Wearable anomaly detection (SIGNAL) | 7 | 2 | 3/5 | Same value as the vitals bridge with more integration surface. |
| 11 | Tumor-board prep engine (OncoFlow) | 8 | 5 | 4/5 | Clinical work-product; requires EHR data. Roadmap slide. |
| 12 | Referral Express / PCP FHIR channel (OncoFlow) | 8 | 3,5 | 4/5 | EHR access is the moat AND the blocker for a student team. Cite as phase 2. |
| 13 | Prior-Auth Autopilot (OncoFlow) | 7 | 5 | 4/5 | Hardest admin pain point but requires payer/EHR integration. Roadmap. |
| 14 | CHW Console + Ministry Toolkit (Lagniappe) | 7 | 4 | 3/5 | Real value, but it's an operations business, not a 12-week demo. Convert to a "partnership model" slide. |
| 15 | Mobile screening event ops + FIT kit loops (Lagniappe/FirstCheck) | 6 | 4 | 4/5 | Operational heavy; cite event-finder integration instead. |
| 16 | Custom hardware — temp patch, telehealth cart (VitalSweep) | 8 | 2 | 5/5 | 510(k) + manufacturing; not feasible in 12 weeks. Their software path is what you'd copy (idea #6), not the hardware. |
| 17 | Return-to-Work & benefits concierge, oncofertility (SecondLine) | 6 | 3 | 4/5 | Depth-over-breadth: you can't do everything. Defer; keep as survivorship-phase 2. |
| 18 | PCP CDS risk feed (FirstCheck) | 8 | 4 | 5/5 | Needs live EMR integration. Keep as a "system architecture" slide. |

---

## The 6 attack vectors every competitor used against BayouCare

These are the weaknesses other teams will lead with — worth defending in the pitch regardless of what you add:

1. **"You react, we predict."** Your check-ins catch problems *after* they happen; SIGNAL and VitalSweep both forecast. → The counterfactual risk layer (Rank 1) is the direct counter.
2. **"No data layer."** Your features are a UI; FirstCheck's parish heat map and SIGNAL's risk models are *systems*. → Add parish-level data + risk scoring.
3. **"Survivorship is the largest population the brief names, and you ignore it."** ~350K LA survivors vs ~30K new diagnoses/yr. → Add the SCP generator (Rank 2).
4. **"Self-reported symptoms only — chemo brain patients don't type."** → Vitals bridge (Rank 6).
5. **"Patient-side only; no provider ROI story."** Ochsner funds workforce amplification, not apps. → Add the admin-time-saved math already on your care-team page; cite prior-auth/referral stats as phase 2.
6. **"EN/ES only in a Creole/Vietnamese state."** → Language toggle (Rank 7).

---

## What this means for the pitch (12 days to draft, ~6 weeks to finals)

- **Implement now (draft):** Ranks 1–4 — predictive flags with counterfactuals, SCP generator + late-effects radar, risk-stratified screening, parish heat map. All four are software-only, demoable on synthetic data, and directly answer the brief's 5 areas.
- **Polish for finals:** Ranks 5–8 (trial matching, vitals bridge, languages, mood check).
- **Slides only:** Ranks 9–18 as a "system architecture / 12-month roadmap" section — shows ambition without scope risk.
- **Defense line in the pitch:** preempt attack vector #2 with one data slide and #3 with one survivorship slide — you get to tell *your* story before they can.

*Compiled from 6 simulated competitor teams (Aug 12, 2026). Baseline: BayouCare prototype v2 (overview, patient app, care-team dashboard, roadmap).*

**Status (Aug 17):** Ranks 1–4 implemented in `index.html` as a working draft — care-team forecasts with counterfactual apply (logistic model + intervention board), survivorship SCP generator + late-effects radar (4 demo survivors), risk-stratified screening calculators (lung LDCT + Quit-to-Screen, breast, colorectal), and the parish heat index with van routing. The parish module now has a **view toggle: tile cartogram ↔ real geographic map** (all 64 parish boundaries from Census Bureau TIGER/500k, simplified — regenerable via `genmap.py`), sharing the same metrics, colors, hover tooltips, and click-to-detail. All demoable on synthetic data; smoke-tested end-to-end and verified by headless-browser rendering. Plus a **light/dark mode toggle** (topbar 🌙/☀️, saved to localStorage, defaults to system preference) — the whole design system runs on CSS tokens so both themes share one code path.
