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
 * Equal-width grid cells, not a left-packed flex row: end labels like
 * "1 · Awful" used to inflate those chips and leave a dead strip of empty
 * space on the right. Spreading the steps across the card keeps the scale
 * readable as a scale.
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
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn(
        'grid w-full gap-2',
        values.length === 5 ? 'grid-cols-5' : 'grid-cols-1 sm:grid-cols-3',
      )}
    >
      {values.map((v, i) => {
        const id = `${name}-${v}`
        const selected = value === v
        return (
          <label
            key={v}
            htmlFor={id}
            className={cn(
              /*
               * Full cell width + min-h-11: every step is the same size and a
               * real thumb target. Text centers and wraps so "1 · Awful" does
               * not force a wider chip than "3".
               *
               * The focus ring is on the LABEL via `has-[:focus-visible]`,
               * because the input itself is `sr-only` — that wiring is already
               * correct and is untouched.
               */
              'flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border px-2 py-2 text-center text-xs font-semibold leading-snug transition-colors duration-200 ease-out',
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
          {/*
            `h-[160px]` rather than the previous 140: the bar heights are
            unchanged (`v * 20`), but each column now carries a visible score
            under its day label and needed the 20px to hold it. Tops out at
            100 + two 6px gaps + two 16px labels = 144.

            The bar's `title` is kept — it is still the better affordance under
            a mouse — but it is no longer the ONLY source. It was: this chart
            has no y-axis, so on a touch device the six scores it plots were
            literally unreadable, with the tooltip unreachable and the bars
            themselves unfocusable `<div>`s. The number is now always visible,
            which is the one of the brief's three options (focus, tap, always
            visible) that works without a pointer of any kind.
          */}
          <div className="flex h-[160px] items-end gap-3">
            {trendBars.map((d, i) => (
              <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn('w-full max-w-[46px] rounded-t-md', BAR_CLASS[d.cls] ?? 'bg-brand-500')}
                  style={{ height: `${Math.round(d.v * 20)}px` }}
                  title={`Score ${d.v}/5`}
                />
                <span className="text-xs text-muted-foreground">{d.label}</span>
                <span className="text-xs font-semibold tabular-nums text-card-foreground">
                  {d.v}
                  <span className="font-normal text-muted-foreground">/5</span>
                </span>
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
