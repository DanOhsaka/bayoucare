import { useNavigate } from 'react-router-dom'

import { RichText } from '@/components/shared/RichText'
import { useT } from '@/hooks/useT'
import { useUi } from '@/store/ui'

/** view id → route, for the `data-goto` buttons. */
const ROUTES: Record<string, string> = {
  app: '/my-care/home',
  team: '/care-team',
  survivorship: '/survivorship',
  population: '/population',
  clinicops: '/clinic-ops',
  roadmap: '/roadmap',
}

/** Which mode each destination lives in — the legacy `gotoView` did the same. */
const MODE: Record<string, 'patient' | 'admin'> = {
  app: 'patient',
  team: 'admin',
  survivorship: 'admin',
  population: 'admin',
  clinicops: 'admin',
  roadmap: 'admin',
}

const STATS = [
  { n: '29,980', small: '/yr', key: 'hero.s1' },
  { n: '165.2', small: 'vs 146.0', key: 'hero.s2' },
  { n: '64', small: 'parishes', key: 'hero.s3' },
  { n: 'You', small: '+ your family', key: 'hero.s4' },
]

const WHY = [
  {
    tag: 'coral',
    tagLabel: 'The problem',
    h: 'We find cancer late',
    p: 'Incidence and mortality both run above the national average — and rural patients navigate a fragmented system alone: a diagnosis with no roadmap, no support.',
  },
  {
    tag: 'amber',
    tagLabel: 'The gap',
    h: "Navigation tools don't exist here",
    p: 'National apps assume broadband and nearby specialists. In Louisiana, care can be hours away and families shoulder logistics alone.',
  },
  {
    tag: 'green',
    tagLabel: 'The opportunity',
    h: 'Technology Louisiana trusts',
    p: 'Plain language, phone-first, plans the miles, connects family and clinicians — built with Louisiana, not adapted from elsewhere.',
  },
] as const

const JOURNEY = [
  ['0 · Prevent', 'Screen & catch early'],
  ['1 · Diagnosis', 'Understand the report'],
  ['2 · Plan', 'Personalized roadmap'],
  ['3 · Treatment', 'Check-ins & coordination'],
  ['4 · Survivorship', 'SCP plan + late-effects radar'],
  ['5 · Supportive care', 'Resources & community'],
]

const TOOLS = [
  ['🧭', 'Understand — AI diagnosis explainer', 'Turns pathology reports into plain English, plus questions to ask your doctor.'],
  ['🗺️', 'My Journey — a real roadmap', 'A living checklist of every step, shared with family.'],
  ['📈', 'Check-ins — earlier intervention', 'Daily symptom check-ins that alert the care team before things escalate.'],
  ['🚗', 'Access — care you can reach', 'Rides, telehealth, financial help, and resources — rural-first.'],
  ['👨👩👧', 'Caregiver hub', 'Family gets a second profile — shared tasks, same plain explanations.'],
  ['🗓️', 'Appointments & calendar', 'Every visit, infusion and scan in one place — with reminders and a ride when you need one.'],
  ['🛡️', 'Screen & Prevent — catch it early', 'Screening reminders based on your own risk, not a generic schedule.'],
  ['📊', 'ASCO-informed guidance', 'Guidelines and education built on the official data partner.'],
]

const RANKS = [
  ['coral', 'Rank 1 · Predictive analytics · brief area 2', '🔮 Flags that prescribe, not just warn', 'Every flagged patient gets a 7-day risk forecast — and the one action that changes it.'],
  ['coral', 'Rank 2 · Survivorship · brief area 1', '📋 Survivorship Care Plans, auto-generated', 'An ASCO-format care plan from the treatment record — plus a late-effects radar.'],
  ['coral', 'Rank 3 · Prevention · brief area 4', '🎯 Risk-stratified screening', 'Lung, breast, and colorectal risk engines — with a Quit-to-Screen bundle wired to the LA Quitline.'],
  ['coral', 'Rank 4 · Rural access · brief area 4', '🗺️ Parish heat index', 'All 64 parishes ranked by unmet need — vans and SMS go where the burden is.'],
  ['amber', 'Rank 5 · Access · brief areas 1, 3', '🔬 TrialMatch — eligibility pre-checked', 'Real NCT trials, every criterion pre-checked against the patient profile.'],
  ['amber', 'Rank 6 · Monitoring · brief area 2', '📡 Vitals bridge — the 2 am blind spot', "Device vitals feed the same escalation engine — the 2 am fever doesn't wait."],
  ['amber', 'Rank 7 · Access · brief area 4', '🌐 Languages — Español live, Kreyòl + Tiếng Việt next', 'A working EN/ES toggle across the patient journey — Kreyòl + Tiếng Việt next.'],
  ['amber', 'Rank 8 · Supportive care · brief areas 1, 3', '💜 Mood check — with real escalation', "A mood check wired to Louisiana's real support paths: NAMI Louisiana and 988."],
  ['green', 'Rank 9 · Admin burden · brief area 5', '🧾 Prior-auth autopilot', 'A payer packet with the guideline citation and every necessity criterion — assembled from the chart.'],
  ['green', 'Rank 10 · Admin burden · brief area 5', '📋 Tumor-board prep', 'Staging, markers and the open questions, assembled before the board meets.'],
  ['green', 'Rank 11 · Rural access · brief areas 3, 5', '🔗 Referral Express', 'One referral from a rural PCP, labs and pathology riding along, status visible to both ends.'],
  ['green', 'Rank 12 · Prevention · brief areas 4, 5', '🩺 PCP decision support feed', "Guideline alerts in the PCP's inbox — the same engine as the patient's calculator."],
  ['green', 'Rank 13 · Access · brief areas 2, 5', '📅 No-show model + rebooking', 'Per-slot risk, protected chairs and an SMS ladder — reading the same features as the care team.'],
] as const

const BARRIERS = [
  ['Delays in diagnosis', 'Screen & Prevent — risk-based reminders + community screening events'],
  ['Complex treatment plans', 'My Journey + Understand — roadmap + plain-language reports'],
  ['Managing side effects', 'Daily Check-ins — automatic escalation'],
  ['Accessing supportive services', 'Resource Finder — aid, groups, trials, social work'],
  ['Transportation & financial barriers', 'Access Hub — rides, mileage, lodging, low-bandwidth telehealth'],
  ['Rural & underserved communities', 'Built Louisiana-first — offline-first, SMS fallback, EN+ES'],
]

const WINS = [
  ['📱', 'Built for low bandwidth', 'Offline-first + SMS fallback for rural patients.'],
  ['🗣️', 'Plain language, English + Spanish', '~8th-grade health literacy, by design.'],
  ['🤝', 'Family-inclusive', 'Caregivers see everything and can help.'],
]

const TAG_CLASS: Record<string, string> = {
  coral: 'bg-danger-bg text-danger-fg',
  amber: 'bg-warning-bg text-warning-fg',
  green: 'bg-success-bg text-success-fg',
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4 mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <span className="text-sm text-muted-foreground">{sub}</span>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)] ${className}`}>
      {children}
    </div>
  )
}

function Tag({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em] ${TAG_CLASS[kind]}`}
    >
      {children}
    </span>
  )
}

export function OverviewScreen() {
  const t = useT()
  const navigate = useNavigate()
  const setMode = useUi((s) => s.setMode)

  /** The legacy `gotoView`: switch mode first, then go there. */
  function go(view: string) {
    setMode(MODE[view] ?? 'patient')
    navigate(ROUTES[view] ?? '/overview')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* --------------------------------------------------------------- hero */}
      <section className="rounded-xl bg-[linear-gradient(160deg,var(--green-900),var(--green-700))] px-6 py-10 text-on-dark sm:px-10">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-on-dark-muted">
          {t('hero.kicker')}
        </span>
        {/*
          hero.h1 carries inline markup — a <br> and a highlighted span — so it is
          the one place on this page rendered as HTML. It comes from the app's own
          dictionary, not from input.
        */}
        <RichText
          html={t('hero.h1')}
          className="mt-3 block text-3xl font-bold leading-tight [&_.hi]:text-[#f2c14e] sm:text-4xl"
        />
        <p className="mt-4 max-w-2xl text-base text-on-dark-muted">{t('hero.lead')}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => go('app')}
            className="inline-flex h-11 items-center rounded-md bg-[#e8960c] px-5 text-sm font-bold text-[#3a2400] transition-opacity hover:opacity-90"
          >
            ▶ {t('hero.cta1')}
          </button>
          <button
            type="button"
            onClick={() => go('team')}
            className="inline-flex h-11 items-center rounded-md border border-white/30 bg-white/10 px-5 text-sm font-bold text-on-dark transition-colors hover:bg-white/20"
          >
            {t('hero.cta2')}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.key} className="rounded-lg bg-white/[0.07] p-4">
              <div className="text-2xl font-bold">
                {s.n} <small className="text-sm font-semibold text-on-dark-muted">{s.small}</small>
              </div>
              <div className="mt-1 text-xs leading-snug text-on-dark-muted">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- why Louisiana needs it */}
      <SectionTitle title="Why Louisiana needs this" sub="The numbers behind the brief" />
      <div className="grid gap-4 md:grid-cols-3">
        {WHY.map((c) => (
          <Card key={c.h}>
            <Tag kind={c.tag}>{c.tagLabel}</Tag>
            <h3 className="mt-3 text-lg font-semibold text-card-foreground">{c.h}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.p}</p>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------------- journey */}
      <SectionTitle title="The journey, guided end to end" sub="Six connected tools, one platform" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {JOURNEY.map(([n, l]) => (
          <div key={n} className="rounded-lg border border-brand-600/30 bg-accent p-3.5">
            <div className="text-xs font-bold text-brand-700">{n}</div>
            <div className="mt-0.5 text-sm font-semibold text-accent-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {TOOLS.map(([ico, h, p]) => (
          <Card key={h}>
            <div className="flex gap-3">
              <span
                className="flex size-10 flex-none items-center justify-center rounded-md bg-accent text-lg"
                aria-hidden="true"
              >
                {ico}
              </span>
              <div>
                <h4 className="text-sm font-semibold text-card-foreground">{h}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{p}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <blockquote className="mt-8 rounded-lg border-l-4 border-brand-600 bg-card p-6 text-base italic text-card-foreground shadow-[var(--shadow)]">
        "When my sister was diagnosed, we spent three weeks just figuring out what happened, what to do
        first, and how to get her to appointments 100 miles away. Nobody handed us a map."
        <span className="mt-3 block text-xs font-semibold not-italic text-muted-foreground">
          — BayouCare field interview, Alexandria, LA (April 2026)
        </span>
      </blockquote>

      {/* -------------------------------------------------- for evaluators */}
      <details className="mt-8 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow)]">
        <summary className="cursor-pointer text-sm font-bold text-card-foreground">
          For evaluators — challenge mapping, the 13 ranks &amp; the pilot plan
        </summary>

        <div className="mt-4">
          <div className="rounded-lg bg-accent p-4">
            <div className="text-sm font-semibold text-accent-foreground">
              Official challenge — "Improve the cancer care journey for patients and caregivers, from
              diagnosis through treatment, survivorship, and supportive care."
            </div>
            <p className="mt-2 text-sm font-bold text-brand-600">
              📊 Official data partner: ASCO — guidelines, education, and quality measures.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              BayouCare addresses every potential solution area in the brief:
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[
                ['AI patient navigation', 'plain-language diagnosis explainer + personalized next-step checklist'],
                ['Predictive analytics & remote monitoring', 'symptom check-ins that flag at-risk patients early'],
                ['Platform connecting patients, caregivers & care teams', 'one shared journey timeline'],
                ['Rural & underserved access', 'telehealth, transportation assistance, resource finder'],
                ['AI reducing admin burden', 'auto-generated visit summaries and risk flags for oncology teams'],
              ].map(([b, rest]) => (
                <li key={b} className="text-sm text-muted-foreground">
                  <b className="text-card-foreground">{b}</b> — {rest}
                </li>
              ))}
            </ul>
          </div>

          <SectionTitle
            title="The ranks — from draft to finals"
            sub="Ranks 1–4 won the draft · 5–8 shipped for the semi-final · 9–13 carry the provider story"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {RANKS.map(([kind, tag, h, p]) => (
              <Card key={h}>
                <Tag kind={kind}>{tag}</Tag>
                <h3 className="mt-3 text-base font-semibold text-card-foreground">{h}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p}</p>
              </Card>
            ))}
          </div>

          <SectionTitle title="Every barrier in the brief, answered" sub="Challenge barrier → BayouCare feature" />
          <Card>
            <ul className="flex flex-col gap-1.5">
              {BARRIERS.map(([b, rest]) => (
                <li key={b} className="text-sm text-muted-foreground">
                  <b className="text-card-foreground">{b}</b> → {rest}
                </li>
              ))}
            </ul>
          </Card>

          <SectionTitle title="Why BayouCare wins" sub="Differential vs. generic health apps" />
          <div className="grid gap-4 md:grid-cols-3">
            {WINS.map(([ico, h, p]) => (
              <Card key={h}>
                <div className="flex gap-3">
                  <span
                    className="flex size-10 flex-none items-center justify-center rounded-md bg-accent text-lg"
                    aria-hidden="true"
                  >
                    {ico}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-card-foreground">{h}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{p}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* The legacy laid these out with inline grid-template-columns, which
              overrode its own media query and stayed 3-across on a phone. */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['-20%', 'treatment-start delay, via navigation + transport support'],
              ['3.2×', 'more patients kept on surveillance schedules'],
              ['2 hrs', 'admin time saved per patient per week'],
            ].map(([n, d]) => (
              <div key={n} className="rounded-lg border border-border bg-accent p-4">
                <div className="text-2xl font-bold text-brand-700">{n}</div>
                <div className="mt-1 text-xs text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Impact figures are modeled targets for the DevDays pilot — to be validated with Ochsner
            partner clinics during the 12-week build.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => go('app')}
              className="inline-flex h-10 items-center rounded-md bg-[#e8960c] px-4 text-sm font-bold text-[#3a2400] transition-opacity hover:opacity-90"
            >
              ▶ Try the patient demo
            </button>
            {[
              ['team', 'Forecast & counterfactuals'],
              ['survivorship', '📋 Survivorship plans'],
              ['population', '🗺️ Parish heat index'],
              ['clinicops', '🏥 Clinic ops — the provider side'],
              ['roadmap', 'Roadmap & pilot plan'],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                onClick={() => go(view)}
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-bold text-foreground transition-colors hover:bg-accent"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
