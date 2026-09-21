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

export function UnderstandScreen() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const firstName = PATIENTS[pid].name.split(' ')[0]

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">{t('understand.head')}</h3>
          <span className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
              {t('understand.chipA')}
            </span>
            <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
              {t('understand.chipB')}
            </span>
          </span>
        </div>

        {/*
          A worked example of the dialogue, not a live chat — the real assistant
          is Remi, on its own screen. The speaker name is bound to the record:
          the legacy had "Darlene" hardcoded here.
        */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-lg bg-brand-700 px-3.5 py-2.5 text-sm text-on-dark">
              <b className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] opacity-80">
                {firstName}
              </b>
              I got my biopsy report and I'm scared. What does "ER+/PR+, HER2−" mean for me?
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-card-foreground">
              <b className="mb-1 block text-[11px] font-bold uppercase tracking-[0.05em] text-brand-700">
                BayouCare
              </b>
              That's completely understandable — let's take it one line at a time. ER+/PR+ means your
              tumor uses estrogen/progesterone to grow, and HER2− means it doesn't use that protein.
              Good news: this type of breast cancer has many effective treatments, and hormone
              therapy can target it directly. I've simplified each section of your report below.
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {SECTIONS.map((s, i) => (
          <details
            key={s.summary}
            open={i === 0}
            className="rounded-lg border border-border bg-card shadow-[var(--shadow)]"
          >
            <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-card-foreground">
              {t(s.summary)}
            </summary>
            <div className="mx-5 mb-5 rounded-md bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">
              {s.body}
            </div>
          </details>
        ))}

        <p className="text-xs text-muted-foreground">
          BayouCare simplifies reports for understanding and always shows what to confirm with your
          care team. It never replaces clinical advice.
        </p>
      </section>
    </div>
  )
}
