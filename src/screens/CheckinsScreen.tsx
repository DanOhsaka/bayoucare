import { Bot, HeartHandshake, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { REQUIRED_QUESTIONS, useCheckins } from '@/store/checkins'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/**
 * The four scored questions and their option labels.
 *
 * These labels are hardcoded English in the legacy app rather than dictionary
 * keys — the question text is translated, the answers are not. Kept as-is for
 * parity; worth adding to the dictionary in a later pass.
 */
const SCORES = [
  { q: 'energy', key: 'checkin.q1', labels: ['1 · Awful', '2', '3', '4', '5 · Great'] },
  { q: 'nausea', key: 'checkin.q2', labels: ['1 · None', '2', '3', '4', '5 · Severe'] },
  { q: 'fever', key: 'checkin.q3', labels: ['1 · Normal', '2', '3', '4', '5 · Feverish'] },
  { q: 'pain', key: 'checkin.q4', labels: ['1 · None', '2', '3', '4', '5 · Worst'] },
]

const MOODS = [
  { q: 'mood1', key: 'mood.q1' },
  { q: 'mood2', key: 'mood.q2' },
  { q: 'mood3', key: 'mood.q3' },
]

const MOOD_LABELS = ['mood.o0', 'mood.o1', 'mood.o2']

/** The bar colour bands. `cls` comes from the record's trend data. */
const BAR_CLASS: Record<string, string> = {
  hi: 'bg-danger',
  mid: 'bg-warning',
  lo: 'bg-success',
}

/**
 * A single-choice scale.
 *
 * Built on real radio inputs rather than buttons: a scale picks one of N, which
 * is what a radiogroup IS, and it gets arrow-key navigation and correct
 * announcement for free. The legacy used plain buttons with a `.sel` class and
 * no accessible state at all.
 *
 * The chip geometry is the app's one chip geometry — `px-2.5 py-1 text-xs` —
 * matching `Badge`. It is written out rather than imported because a scale
 * option is a control with a selected state, which is not what `Badge` is.
 */
function Scale({
  name,
  labelId,
  values,
  labels,
  value,
  onChange,
}: {
  name: string
  labelId: string
  values: number[]
  labels: string[]
  value: number | undefined
  onChange: (v: number) => void
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
      {values.map((v, i) => {
        const id = `${name}-${v}`
        const selected = value === v
        return (
          <label
            key={v}
            htmlFor={id}
            className={cn(
              'cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)]',
              selected
                ? 'border-brand-600 bg-brand-700 text-on-dark'
                : 'border-border bg-background text-foreground hover:bg-accent',
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={v}
              checked={selected}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            {labels[i]}
          </label>
        )
      })}
    </div>
  )
}

export function CheckinsScreen() {
  const t = useT()
  const answers = useCheckins((s) => s.answers)
  const trendBars = useCheckins((s) => s.trendBars)
  const summary = useCheckins((s) => s.summary)
  const setAnswer = useCheckins((s) => s.setAnswer)
  const submit = useCheckins((s) => s.submit)

  function onSubmit() {
    const result = submit()
    if (!result.ok) {
      toast(result.reason ?? 'Could not save that check-in.')
      return
    }
    toast(result.toast ?? '✅ Check-in saved.')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('checkin.head')}</CardTitle>
          <Badge variant="success">{t('checkin.chip')}</Badge>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            {SCORES.map((s) => (
              <div key={s.q} className="flex flex-col gap-2 rounded-md border border-border p-3.5">
                <div id={`q-${s.q}`} className="text-sm font-semibold text-card-foreground">
                  {t(s.key)}
                </div>
                <Scale
                  name={s.q}
                  labelId={`q-${s.q}`}
                  values={[1, 2, 3, 4, 5]}
                  labels={s.labels}
                  value={answers[s.q]}
                  onChange={(v) => setAnswer(s.q, v)}
                />
              </div>
            ))}

            <div className="flex flex-col gap-3 rounded-md border border-brand-100 bg-accent p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                <HeartHandshake className="size-4" aria-hidden="true" />
                {t('mood.head')}
              </div>

              {MOODS.map((m) => (
                <div key={m.q} className="flex flex-col gap-2">
                  <div id={`q-${m.q}`} className="text-sm text-accent-foreground">
                    {t(m.key)}
                  </div>
                  <Scale
                    name={m.q}
                    labelId={`q-${m.q}`}
                    values={[0, 1, 2]}
                    labels={MOOD_LABELS.map((k) => t(k))}
                    value={answers[m.q]}
                    onChange={(v) => setAnswer(m.q, v)}
                  />
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                💬 Answers are private, shared only with your care team. If you're in crisis right now:
                call or text <b className="text-card-foreground">988</b> — free, 24/7, confidential.
              </p>
            </div>
          </div>

          <Button type="button" size="lg" className="mt-4 w-full font-bold" onClick={onSubmit}>
            {t('checkin.submit')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
            {t('checkin.trend')}
          </CardTitle>
          <Badge variant="neutral">{t('checkin.trendChip')}</Badge>
        </CardHeader>

        <CardContent>
          <div className="flex h-[140px] items-end gap-3">
            {trendBars.map((d, i) => (
              <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn('w-full max-w-[46px] rounded-t-md', BAR_CLASS[d.cls] ?? 'bg-brand-500')}
                  style={{ height: `${Math.round(d.v * 20)}px` }}
                  title={`Score ${d.v}/5`}
                />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>

          <p className="mt-2.5 text-sm text-muted-foreground">
            {summary ? `Latest score ${summary.lead?.match(/Overall wellness ([\d.]+)\/5/)?.[1] ?? ''}/5` : t('checkin.trendNote')}
          </p>
        </CardContent>
      </Card>

      {summary?.ok && (
        <Card className="border-brand-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4 text-muted-foreground" aria-hidden="true" />
              🤖 What BayouCare sees
            </CardTitle>
            <Badge variant="warning">{t('checkin.aiChip')}</Badge>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-card-foreground">
              {summary.lead}
              {summary.flag && (
                <b
                  className={cn(
                    summary.flag.kind === 'fever' || summary.flag.kind === 'pain'
                      ? 'text-danger-fg'
                      : 'font-semibold',
                  )}
                >
                  {summary.flag.text}
                </b>
              )}
            </p>

            {summary.mood && <p className="mt-3 text-sm text-muted-foreground">{summary.mood}</p>}
          </CardContent>
        </Card>
      )}

      <p className="sr-only">
        {REQUIRED_QUESTIONS.length} scored questions, plus three optional mood questions.
      </p>
    </div>
  )
}
