import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePatient } from '@/store/patient'
import { PATIENTS } from '@/data'
import { useT } from '@/hooks/useT'

/**
 * The plain-language report explainer.
 *
 * Note the `.plain` blocks use `bg-accent text-accent-foreground` rather than the
 * legacy's `--green-50` background with `--green-800` text. That pair is the
 * dark-mode contrast bug: both tokens darken, so it computed to 1.71:1 and the
 * most clinically important text on this screen was near-invisible in dark mode.
 * The semantic pair measures 9.2:1.
 */
const SECTIONS = [
  {
    summary: 'understand.d1',
    body: (
      <>
        <b>Invasive ductal carcinoma, Grade 2.</b> A cancer that started in the milk duct and is
        growing slowly-to-moderately. Grade 2 means the cells look fairly similar to normal cells.
        This is the most common type of breast cancer and is very treatable, especially when caught
        early — yours was caught at <b>Stage II</b>, before it spread beyond the breast and nearby
        nodes.
      </>
    ),
  },
  {
    summary: 'understand.d2',
    body: (
      <>
        <b>Think of it as the tumor's "remote control."</b> ER+ and PR+ mean hormones in your body
        can "turn on" the cancer — so we can use medicines that block those hormones. HER2− means
        this type doesn't respond to HER2-targeted drugs, which is fine — other therapies work very
        well. Together, this profile responds well to <b>hormone therapy + chemo</b>, which is
        exactly the plan Dr. Peters built with you.
      </>
    ),
  },
  {
    summary: 'understand.d3',
    body: (
      <ul className="flex flex-col gap-2">
        {[
          'How will we know the chemo is working?',
          'What side effects should I call about vs. manage at home?',
          'Should I take a genetic test (like BRCA) — and what would it mean for my daughters?',
          'What does "survivorship" look like for me after treatment ends?',
        ].map((q) => (
          <li key={q} className="flex gap-2">
            <span aria-hidden="true">✅</span>
            <b>{q}</b>
          </li>
        ))}
      </ul>
    ),
  },
]

/**
 * Which records this explainer is actually written for.
 *
 * Every body below names the grade, the hormone receptors and the Stage II
 * breast picture, and the worked dialogue has the patient asking what
 * "ER+/PR+, HER2−" means. That is invasive ductal carcinoma and nothing else.
 *
 * Two of the four demo accounts are NOT that: `priscilla@` is non-small-cell
 * lung and `marcus@` is DLBCL lymphoma. Until this guard existed they were told
 * "this is the most common type of breast cancer" about their own diagnosis —
 * confidently wrong clinical content, on the screen whose whole job is
 * explaining a diagnosis, in front of an audience of Ochsner clinicians.
 *
 * The fallback below shows the patient's OWN recorded fields rather than
 * inventing medical text for diagnoses nobody has reviewed.
 */
const EXPLAINER_MATCHES = /ductal carcinoma|\bIDC\b/i

/** The record's own diagnosis fields, plainly — no interpretation added. */
function RecordOnly() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const p = PATIENTS[pid]
  const firstName = p.name.split(' ')[0]

  const rows: Array<[string, string]> = (
    [
      ['understand.fDx', p.dx],
      ['understand.fStage', p.stage],
      ['understand.fGrade', p.grade],
      ['understand.fMarkers', p.subtype],
    ] as Array<[string, string | undefined]>
  ).filter((r): r is [string, string] => Boolean(r[1]))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('understand.head')}</CardTitle>
          <CardAction>
            <Badge variant="neutral">{t('understand.recordOnly')}</Badge>
          </CardAction>
        </CardHeader>

        <p className="text-sm text-muted-foreground">
          {t('understand.recordOnlyNote', { name: firstName })}
        </p>

        <CardContent>
          <dl className="flex flex-col gap-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap gap-x-3 rounded-md border border-border p-3">
                <dt className="text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">
                  {t(label)}
                </dt>
                <dd className="min-w-0 flex-1 text-sm font-semibold text-card-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t('understand.disclaimer')}</p>
    </div>
  )
}

export function UnderstandScreen() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = PATIENTS[pid]
  const firstName = patient.name.split(' ')[0]

  if (!EXPLAINER_MATCHES.test(patient.dx)) return <RecordOnly />

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('understand.head')}</CardTitle>
          <CardAction>
            <Badge variant="success">{t('understand.chipA')}</Badge>
            <Badge variant="warning">{t('understand.chipB')}</Badge>
          </CardAction>
        </CardHeader>

        {/*
          A worked example of the dialogue, not a live chat — the real assistant
          is Remi, on its own screen. The speaker name is bound to the record:
          the legacy had "Darlene" hardcoded here.
        */}
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-brand-700 px-3.5 py-2.5 text-sm text-on-dark">
                <b className="mb-1 block text-xs font-bold uppercase tracking-[0.05em] opacity-80">
                  {firstName}
                </b>
                I got my biopsy report and I'm scared. What does "ER+/PR+, HER2−" mean for me?
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-card-foreground">
                <b className="mb-1 block text-xs font-bold uppercase tracking-[0.05em] text-link">
                  BayouCare
                </b>
                That's completely understandable — let's take it one line at a time. ER+/PR+ means your
                tumor uses estrogen/progesterone to grow, and HER2− means it doesn't use that protein.
                Good news: this type of breast cancer has many effective treatments, and hormone
                therapy can target it directly. I've simplified each section of your report below.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        {SECTIONS.map((s, i) => (
          /* `p-0` because the card here IS the disclosure: the padding lives on
             the summary and its panel, and `Card` must not add a second frame
             inside the element that owns the open/closed state. */
          <Card key={s.summary} className="p-0">
            <details open={i === 0}>
              <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-card-foreground">
                {t(s.summary)}
              </summary>
              <div className="mx-5 mb-5 rounded-md bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">
                {s.body}
              </div>
            </details>
          </Card>
        ))}

        <p className="text-xs text-muted-foreground">
          BayouCare simplifies reports for understanding and always shows what to confirm with your
          care team. It never replaces clinical advice.
        </p>
      </section>
    </div>
  )
}
