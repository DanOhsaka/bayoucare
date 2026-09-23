import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** The three phases. `tone` drives the numbered badge. */
const PHASES = [
  {
    n: '1',
    tone: 'green',
    h: 'Prototype & validation (now – Sept 25)',
    d: (
      <>
       Ranks 1–4 shipped in the Aug 17 draft — <b>predictive flags with counterfactuals</b> (care
        team), <b>SCP generator + late-effects radar</b> (survivorship),{' '}
        <b>risk-stratified screening</b> (patient app), <b>parish heat index</b> (all 64 parishes) —
        and passed to the semi-finals. Ranks 5–8 shipped Aug 25 for the virtual semi-finals (Aug
        26–27): <b>TrialMatch eligibility engine</b>, <b>objective vitals bridge</b> into the
        escalation flow, <b>four working languages</b> (EN · ES · Kreyòl ayisyen · Tiếng Việt), and
        the <b>mood check with 988/NAMI LA escalation</b>. Ranks 9–13 shipped for the finals (Sept
        25) as a Clinic Ops tab carrying brief area 5 — <b>prior-auth autopilot</b>,{' '}
        <b>tumor-board prep</b>, <b>Referral Express</b>, a <b>PCP decision-support feed</b>, and{' '}
        <b>per-slot no-show prediction with smart rebooking</b> — plus a{' '}
        <b>14-day abnormal-result follow-up queue</b> and FIT-kit return tracking in the parish
        module. Next: 10+ field interviews with patients, caregivers, and oncology staff in Central
        Louisiana; validate the care-journey map with Ochsner navigators; map education content to
        ASCO's patient-education standards (official challenge data partner).
      </>
    ),
    meta: 'Deliverable: working demo + findings deck · data from ASCO · aligns to brief areas 1–5',
  },
  {
    n: '2',
    tone: 'amber',
    h: 'Clinical pilot (Q1 2027)',
    d: (
      <>
       Deploy with 2 Ochsner oncology clinics; enroll 50 patients; measure treatment-start delay,
        check-in adherence, and clinician admin time vs. baseline — benchmarked against ASCO quality
        measures. SMS + low-bandwidth mode first.
      </>
    ),
    meta: 'Deliverable: pilot with real outcome metrics vs. ASCO benchmarks · aligns to brief areas 2, 5',
  },
  {
    n: '3',
    tone: 'coral',
    h: 'Scale across Louisiana (2027–28)',
    d: (
      <>
       Partnerships with LSU Health, Federally Qualified Health Centers, and the Louisiana Cancer
        Prevention &amp; Control Programs; survivorship + screening campaigns; reimbursement pathway
        via chronic care management codes.
      </>
    ),
    meta: 'Deliverable: statewide roadmap + sustainability model',
  },
] as const

/** Phase tone → the saturated-fill `Badge` variant. */
const PHASE_BADGE: Record<string, 'brand' | 'solid-warning' | 'solid-danger'> = {
  green: 'brand',
  amber: 'solid-warning',
  coral: 'solid-danger',
}

const CARDS = [
  {
    tag: 'green',
    label: 'The team',
    h: 'Who we are',
    p: 'CS + engineering + business students from Louisiana universities, advised by faculty and — we hope — by Ochsner clinicians during the build. Design partners: patients and caregivers from Alexandria and Baton Rouge.',
  },
  {
    tag: 'amber',
    label: 'What we need',
    h: 'From this challenge',
    p: "Feedback from Ochsner navigators on the journey map; a clinic contact for the pilot; the DevDays platform's visibility to recruit co-builders across our university.",
  },
  {
    tag: 'coral',
    label: 'The ask',
    h: 'Why this wins',
    p: "Cancer navigation is the #1 gap named in the brief, Louisiana's rural access problem is the worst in the nation, and a family-inclusive, low-bandwidth platform is something no national app delivers today.",
  },
] as const

/** Card tag → the tint `Badge` variant. */
const TAG_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  amber: 'warning',
  coral: 'danger',
}

export function RoadmapScreen() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl font-semibold text-foreground">Roadmap</h2>
        <span className="text-sm text-muted-foreground">From DevDays draft to Louisiana pilot</span>
      </div>

      <div className="flex flex-col gap-4">
        {PHASES.map((p) => (
          <div key={p.n} className="flex gap-4">
            <Badge variant={PHASE_BADGE[p.tone]} className="size-9 text-sm" aria-hidden="true">
              {p.n}
            </Badge>
            <Card className="min-w-0 flex-1">
              <CardHeader>
                <CardTitle>{p.h}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                <p className="mt-2.5 text-xs italic text-muted-foreground">{p.meta}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <section className="mt-4 rounded-lg border border-brand-100 bg-accent p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-accent-foreground">
            Data &amp; insights — official challenge partner: ASCO
          </h3>
          <Badge variant="success" className="text-left whitespace-normal">
           American Society of Clinical Oncology
          </Badge>
        </div>
        <p className="text-sm text-accent-foreground">
         ASCO is the challenge's official data source. BayouCare operationalizes it in three ways:{' '}
          <b>1)</b> screening schedules follow ASCO &amp; ACS guidelines (Screen &amp; Prevent
          module) · <b>2)</b> patient education maps to ASCO's plain-language standards (Understand
          module) · <b>3)</b> pilot outcomes benchmark against ASCO quality measures —
          time-to-treatment, surveillance adherence, and treatment-interruption flags (Care Team
          dashboard).
        </p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <Card key={c.h}>
            <CardContent>
              <Badge variant={TAG_BADGE[c.tag]} className="uppercase tracking-[0.05em]">
                {c.label}
              </Badge>
              <CardTitle className="mt-3">{c.h}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{c.p}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
