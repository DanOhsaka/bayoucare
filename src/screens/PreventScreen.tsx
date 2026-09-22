import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Field, INPUT_CLASS, PersonaButton, SELECT_CLASS, Stat } from '@/components/shared/Field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BREAST_PERSONAS,
  COLO_PERSONAS,
  LUNG_PERSONAS,
  riskBreast,
  riskColo,
  riskLung,
  type BreastInput,
  type ColoInput,
  type LungInput,
  type Tier,
} from '@/engine/screening'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { useClinic } from '@/store/clinic'

const TIER_BADGE: Record<Tier, 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  mod: 'warning',
  low: 'success',
}

/* The calculator chips are set in caps; every other chip in the patient app is
   sentence case. Left as caps here because dropping it changes what the screen
   reads as, and the audit did not call for it — see the migration notes. */
const CHIP_CAPS = 'uppercase tracking-[0.04em]'

function ResultBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-border bg-accent p-3.5 text-sm text-accent-foreground">
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- lung */

function LungCalculator() {
  /*
   * The inputs live in the shared `clinic` slice rather than local state so
   * that Clinic Ops' "Probe in patient app" can seed them from the CDS alert —
   * the patient must land on the SAME numbers the PCP's card showed. `setV`
   * keeps its single-argument shape, so every call site below is unchanged.
   */
  const t = useT()
  const v = useClinic((s) => s.calc.ldct)
  const setV = (next: LungInput) => useClinic.getState().setCalc('ldct', next)
  const [result, setResult] = useState<ReturnType<typeof riskLung> | null>(null)

  // A probe expects the answer on arrival, not a filled-in form — the legacy
  // called `calcLung()` itself before switching tabs. Clearing the flag makes
  // this fire once, not on every later visit.
  const autoCalc = useClinic((s) => s.autoCalc)
  useEffect(() => {
    if (autoCalc !== 'ldct') return
    setResult(riskLung(useClinic.getState().calc.ldct))
    useClinic.getState().clearAutoCalc()
  }, [autoCalc])
  const num = (s: string) => (s === '' ? 0 : Number(s))

  return (
    <Card>
      <CardHeader>
        <CardTitle>🫁 Lung (LDCT)</CardTitle>
        <Badge variant="neutral" className={CHIP_CAPS}>
          USPSTF 2021
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <PersonaButton onClick={() => { setV({ ...LUNG_PERSONAS.tom }); setResult(null) }}>
            Tom · 62, 40 pk-yr
          </PersonaButton>
          <PersonaButton onClick={() => { setV({ ...LUNG_PERSONAS.rita }); setResult(null) }}>
            Rita · 70, quit 3y
          </PersonaButton>
          {/* A scenario, not a person — the other two are population personas from
              CDS_PANEL, and this one used to be the logged-in patient, which read
              as a claim about whoever was signed in. */}
          <PersonaButton onClick={() => { setV({ ...LUNG_PERSONAS.neversmoker }); setResult(null) }}>
            Never smoked · 58
          </PersonaButton>
        </div>

        <div className="flex flex-col gap-2.5">
          <Field label="Age" id="lung-age">
            <input id="lung-age" type="number" min={18} max={90} className={INPUT_CLASS}
              value={v.age} onChange={(e) => setV({ ...v, age: num(e.target.value) })} />
          </Field>
          <Field label="Smoking history (pack-years)" id="lung-packs">
            <input id="lung-packs" type="number" min={0} max={200} className={INPUT_CLASS}
              value={v.packs} onChange={(e) => setV({ ...v, packs: num(e.target.value) })} />
          </Field>
          <Field label="Status" id="lung-status">
            <select id="lung-status" className={SELECT_CLASS} value={v.status}
              onChange={(e) => setV({ ...v, status: e.target.value })}>
              <option value="current">Current smoker</option>
              <option value="former">Former smoker</option>
              <option value="never">Never smoked</option>
            </select>
          </Field>
          <Field label="Years since quitting (if former)" id="lung-quit">
            <input id="lung-quit" type="number" min={0} max={60} className={INPUT_CLASS}
              value={v.quit} onChange={(e) => setV({ ...v, quit: num(e.target.value) })} />
          </Field>
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-3.5 w-full font-bold"
          onClick={() => setResult(riskLung(v))}
        >
          {t('prevent.calc')}
        </Button>

        {result && (
          <ResultBlock>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>
                {result.tier === 'high'
                  ? 'High risk — LDCT recommended'
                  : result.tier === 'mod'
                    ? 'Moderate risk — discuss with your provider'
                    : 'Lower risk — annual wellness is enough'}
              </b>
              <Badge variant={TIER_BADGE[result.tier]}>{result.tier.toUpperCase()}</Badge>
            </div>
            <p className="mt-1.5">{result.msg}</p>

            {v.packs > 0 && (
              <>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Stat k="Pack-years" v={v.packs} />
                  <Stat k="6-yr risk" v={`${result.plco}%`} />
                  <Stat k="LDCT eligible" v={result.ldct ? 'Yes — next due soon' : 'Not yet'} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  The 6-year figure is a demo approximation of PLCOm2012 over the four inputs above —
                  not the published model. Eligibility follows USPSTF 2021.
                </p>
              </>
            )}

            {v.status === 'current' && v.packs >= 20 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-md border border-warning/40 bg-warning-bg p-3 text-warning-fg">
                <span>🔥</span>
                <b>Quit-to-Screen bundle:</b>
                <span className="text-sm">
                  LA Quitline referral (1-800-QUIT-NOW) + NRT guidance wired to your LDCT order.
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="font-bold"
                  onClick={() => toast('✅ Referral sent to LA Quitline + your care team.')}
                >
                  Refer me
                </Button>
              </div>
            )}
          </ResultBlock>
        )}
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------- breast */

function BreastCalculator() {
  const t = useT()
  const v = useClinic((s) => s.calc.breast)
  const setV = (next: BreastInput) => useClinic.getState().setCalc('breast', next)
  const [result, setResult] = useState<ReturnType<typeof riskBreast> | null>(null)

  const autoCalc = useClinic((s) => s.autoCalc)
  useEffect(() => {
    if (autoCalc !== 'breast') return
    setResult(riskBreast(useClinic.getState().calc.breast))
    useClinic.getState().clearAutoCalc()
  }, [autoCalc])
  const num = (s: string) => (s === '' ? 0 : Number(s))

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎀 Breast</CardTitle>
        <Badge variant="neutral" className={CHIP_CAPS}>
          ACS 2023 · family-history based
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <PersonaButton onClick={() => { setV({ ...BREAST_PERSONAS.renee }); setResult(null) }}>Renee · 34, no history</PersonaButton>
          <PersonaButton onClick={() => { setV({ ...BREAST_PERSONAS.audrey }); setResult(null) }}>Audrey · 42, mom 48</PersonaButton>
          <PersonaButton onClick={() => { setV({ ...BREAST_PERSONAS.marie }); setResult(null) }}>Marie · 38, BRCA signal</PersonaButton>
        </div>

        <div className="flex flex-col gap-2.5">
          <Field label="Age" id="breast-age">
            <input id="breast-age" type="number" min={18} max={90} className={INPUT_CLASS}
              value={v.age} onChange={(e) => setV({ ...v, age: num(e.target.value) })} />
          </Field>
          <Field label="First-degree relatives with breast cancer" id="breast-fdr">
            <select id="breast-fdr" className={SELECT_CLASS} value={v.fdr}
              onChange={(e) => setV({ ...v, fdr: num(e.target.value) })}>
              <option value={0}>None</option>
              <option value={1}>One</option>
              <option value={2}>Two or more</option>
            </select>
          </Field>
          <Field label="BRCA warning signs (male breast cancer · Ashkenazi Jewish · relative dx < 50)" id="breast-sig">
            <select id="breast-sig" className={SELECT_CLASS} value={v.sig}
              onChange={(e) => setV({ ...v, sig: e.target.value })}>
              <option value="none">None</option>
              <option value="yes">Yes, in my family</option>
            </select>
          </Field>
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-3.5 w-full font-bold"
          onClick={() => setResult(riskBreast(v))}
        >
          {t('prevent.calc')}
        </Button>

        {result && (
          <ResultBlock>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>
                {result.tier === 'high'
                  ? 'High risk — genetic counseling + MRI'
                  : result.tier === 'mod'
                    ? 'Moderate risk'
                    : 'Average risk'}
              </b>
              <Badge variant={TIER_BADGE[result.tier]}>{result.tier.toUpperCase()}</Badge>
            </div>
            <p className="mt-1.5">{result.msg}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Stat k="Relatives with breast CA" v={v.fdr === 0 ? 'None' : v.fdr} />
              <Stat k="Screening start" v={result.start} />
              <Stat k="Frequency" v={`Annual${result.mri}`} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Based on family-history risk factors only — this is not a validated model (Tyrer-Cuzick
              or others). A genetic-counseling referral is how a formal estimate gets made.
            </p>
          </ResultBlock>
        )}
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------- colorectal */

function ColoCalculator() {
  const t = useT()
  const v = useClinic((s) => s.calc.colo)
  const setV = (next: ColoInput) => useClinic.getState().setCalc('colo', next)
  const [result, setResult] = useState<ReturnType<typeof riskColo> | null>(null)

  const autoCalc = useClinic((s) => s.autoCalc)
  useEffect(() => {
    if (autoCalc !== 'colo') return
    setResult(riskColo(useClinic.getState().calc.colo))
    useClinic.getState().clearAutoCalc()
  }, [autoCalc])
  const num = (s: string) => (s === '' ? 0 : Number(s))

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧫 Colorectal</CardTitle>
        <Badge variant="neutral" className={CHIP_CAPS}>
          USPSTF 2021
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <PersonaButton onClick={() => { setV({ ...COLO_PERSONAS.marcus }); setResult(null) }}>Marcus · 31</PersonaButton>
          <PersonaButton onClick={() => { setV({ ...COLO_PERSONAS.james }); setResult(null) }}>James · 64, dad 55</PersonaButton>
          <PersonaButton onClick={() => { setV({ ...COLO_PERSONAS.carla }); setResult(null) }}>Carla · 50, none</PersonaButton>
        </div>

        <div className="flex flex-col gap-2.5">
          <Field label="Age" id="colo-age">
            <input id="colo-age" type="number" min={18} max={90} className={INPUT_CLASS}
              value={v.age} onChange={(e) => setV({ ...v, age: num(e.target.value) })} />
          </Field>
          <Field label="Family history (colorectal cancer)" id="colo-fdr">
            <select id="colo-fdr" className={SELECT_CLASS} value={v.f}
              onChange={(e) => setV({ ...v, f: e.target.value })}>
              <option value="none">None</option>
              <option value="one60">One relative, dx at 60+</option>
              <option value="oneyoung">One relative, dx before 60</option>
              <option value="multiple">Two or more relatives</option>
            </select>
          </Field>
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-3.5 w-full font-bold"
          onClick={() => setResult(riskColo(v))}
        >
          {t('prevent.calc')}
        </Button>

        {result && (
          <ResultBlock>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>🧫 Colorectal</b>
              <Badge variant={result.high ? TIER_BADGE.mod : TIER_BADGE.low}>
                {result.high ? 'HIGHER RISK' : 'AVERAGE RISK'}
              </Badge>
            </div>
            <p className="mt-1.5">{result.msg}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stat k="Start age" v={result.startAge} />
              <Stat k="Status" v={v.age < result.startAge ? 'not due yet' : 'due now'} />
            </div>
            {v.age >= result.startAge && (
              <p className="mt-2 text-xs text-muted-foreground">
                Tip: FIT kits can be mailed home and returned by post — no appointment needed.
              </p>
            )}
          </ResultBlock>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------- community + family */

const COMMUNITY_EVENTS = [
  {
    id: 'mammo-van',
    ico: '🚐',
    title: 'Free mammogram van',
    where: 'Alexandria Farmers Market',
    when: 'Sat, Sep 12 · 9 am–3 pm',
    note: 'Walk-ins welcome · no insurance needed',
  },
  {
    id: 'colo-day',
    ico: '🩻',
    title: 'Free colorectal screening',
    where: 'Rapides Parish Health Unit',
    when: 'Fri, Sep 19 · 8 am–1 pm',
    note: 'FIT kits and scheduling on site',
  },
  {
    id: 'lung-drive',
    ico: '🫁',
    title: 'Lung CT screening day',
    where: 'Natchitoches',
    when: 'Fri, Oct 3',
    note: 'For people 50+ with a smoking history',
  },
] as const

function CommunityEventsCard() {
  const t = useT()
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  function toggleSave(id: string, title: string) {
    setSaved((prev) => {
      const next = !prev[id]
      toast(next ? `Saved “${title}” to your calendar.` : `Removed “${title}” from saved events.`)
      return { ...prev, [id]: next }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('prevent.nearYou')}</CardTitle>
        <Badge variant="warning">{t('prevent.nearChip')}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t('prevent.nearSub')}</p>
        <ul className="flex flex-col gap-2">
          {COMMUNITY_EVENTS.map((ev) => {
            const isSaved = Boolean(saved[ev.id])
            return (
              <li
                key={ev.id}
                className="flex items-start gap-3 rounded-md border border-border p-2.5"
              >
                <span
                  className="flex size-10 flex-none items-center justify-center rounded-md bg-accent text-lg"
                  aria-hidden="true"
                >
                  {ev.ico}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-semibold text-card-foreground">{ev.title}</b>
                  <p className="text-xs text-muted-foreground">{ev.where}</p>
                  <p className="text-xs font-medium text-card-foreground">{ev.when}</p>
                  <p className="text-xs text-muted-foreground">{ev.note}</p>
                </div>
                <Button
                  type="button"
                  variant={isSaved ? 'secondary' : 'outline'}
                  size="xs"
                  onClick={() => toggleSave(ev.id, ev.title)}
                  aria-pressed={isSaved}
                  className="flex-none font-bold"
                >
                  {isSaved ? t('prevent.saved') : t('prevent.remind')}
                </Button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function FamilyScreeningCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Looking out for family</CardTitle>
        <Badge variant="neutral">Family</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          BayouCare will nudge Renee and Marcus when it’s their turn to screen.
        </p>
        <ul className="flex flex-col gap-2">
          <li className="rounded-md border border-border p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-sm font-semibold text-card-foreground">Renee · 34</b>
              <span className="text-xs font-semibold text-muted-foreground">Mammogram at 40</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Reminder set for her 40th birthday — about 6 years from now.
            </p>
          </li>
          <li className="rounded-md border border-border p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-sm font-semibold text-card-foreground">Marcus · 31</b>
              <span className="text-xs font-semibold text-muted-foreground">Colon screening later</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Average risk starts at 45. We’ll remind him well before then.
            </p>
          </li>
        </ul>
        <div className="rounded-md border border-warning/40 bg-warning-bg p-3 text-warning-fg">
          <b className="block text-sm">Ask at your next visit</b>
          <p className="mt-1 text-sm">
            Talk with Dr. Peters about BRCA testing. If family risk is higher, Renee and Marcus
            may need to start screening sooner.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ screen */

export function PreventScreen() {
  const t = useT()

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-[18px] text-brand-600" aria-hidden="true" />
            {t('prevent.head')}
          </CardTitle>
          <Badge variant="success">{t('prevent.chip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('prevent.sub')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('prevent.riskHead')}</CardTitle>
          <Badge variant="success">{t('prevent.riskChip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('prevent.riskSub')}</p>
        </CardContent>
      </Card>

      {/*
        Three risk calculators. At `lg` alone they stacked into one column for
        the whole tablet range, which rendered three full-width numeric forms —
        the clearest case of a phone layout stretched across 820px. Two up from
        `md` keeps each form near its natural width and still reads as a set.
      */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LungCalculator />
        <BreastCalculator />
        <ColoCalculator />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('prevent.planHead')}</CardTitle>
            <Badge variant="success" className={CHIP_CAPS}>
              {t('prevent.planChip')}
            </Badge>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {[
                ['Mammogram — done this year', 'Annual screening · recorded by BayouCare', '✓', true],
                ['Colorectal screening — done', 'Colonoscopy 2025 · next due 2035', '✓', true],
                ['Skin check — due next month', 'Annual dermatology visit · 3 reminders queued', 'Sep 14', false],
                ['HPV prevention info', 'For the grandkids · ASCO-aligned explainer ready to share', 'Open', false],
              ].map(([h, s, due, done]) => (
                <li key={h as string} className="flex items-start gap-2.5 rounded-md border border-border p-2.5">
                  <span
                    className={cn(
                      'mt-0.5 flex size-4 flex-none items-center justify-center rounded-full text-xs font-bold',
                      done ? 'bg-brand-500 text-on-dark' : 'border border-border',
                    )}
                    aria-hidden="true"
                  >
                    {done ? '✓' : ''}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold text-card-foreground">{h as string}</b>
                    <span className="text-xs text-muted-foreground">{s as string}</span>
                  </div>
                  <span className="flex-none text-xs font-semibold text-muted-foreground">
                    {due as string}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <CommunityEventsCard />

        <FamilyScreeningCard />

        <Card>
          <CardHeader>
            <CardTitle>Why early screening matters here</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Louisiana finds cancer later than most of the country. Catching it early is the
              biggest difference we can make.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat k="New cases" v="Above US avg" />
              <Stat k="Cancer deaths" v="Above US avg" />
              <Stat k="Early breast CA" v="99%+ survive" />
            </div>
            <p className="text-xs text-muted-foreground">
              Late-stage breast cancer survival drops to about 30%. These tools exist to help
              more people land on the early side of that gap.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">{t('remi.chipFoot')}</p>
    </div>
  )
}
