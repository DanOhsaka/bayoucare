import { Activity, Scale } from 'lucide-react'
import { toast } from 'sonner'

import { REPLAY_STEPS, useVitals } from '@/store/vitals'
import { useInterval } from '@/hooks/useInterval'
import { useInterp } from '@/hooks/useInterp'
import { useT } from '@/hooks/useT'

/** The style token each replay line uses, from the legacy `cls` column. */
const LINE_STYLE: Record<string, string> = {
  t: 'text-muted-foreground',
  crit: 'text-danger-fg font-bold',
  act: 'text-warning-fg font-bold',
  ok: 'text-success-fg',
}

export function VitalsScreen() {
  const t = useT()
  const ti = useInterp()

  const tempC = useVitals((s) => s.tempC)
  const replayStep = useVitals((s) => s.replayStep)
  const replaying = useVitals((s) => s.replaying)
  const smsVisible = useVitals((s) => s.smsVisible)
  const tick = useVitals((s) => s.tick)
  const startReplay = useVitals((s) => s.startReplay)
  const advanceReplay = useVitals((s) => s.advanceReplay)

  /*
   * Both intervals are scoped to this screen rather than the app root.
   *
   * The legacy ran the temp ticker globally and never cleaned it up, so it kept
   * firing against a detached node on every other screen. Nothing outside these
   * cards reads the reading, so unmounting is the correct place for it to stop.
   *
   * The replay is the opposite case in one respect — its OUTPUT (the flagged
   * sweep row and the alert) outlives the screen, because the admin Morning
   * Sweep reads it. That state lives in the store, so navigating away mid-replay
   * keeps the escalation and only stops the remaining animation.
   */
  useInterval(tick, 2500)
  useInterval(advanceReplay, replayStep >= 0 ? 800 : null)

  // The played steps, which persist after the run finishes.
  const playing = REPLAY_STEPS.slice(0, replayStep)
  const tempF = (tempC * 9) / 5 + 32

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-card-foreground">{t('vitals.head')}</h3>
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
            {t('vitals.chip')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('vitals.sub')}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
              <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
              {t('vitals.patchHead')}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success-fg">
              <i
                className="block size-1.5 animate-pulse rounded-full bg-success-fg"
                aria-hidden="true"
              />
              {t('vitals.live')}
            </span>
          </div>

          {/* aria-live so a reading that crosses the threshold is announced
              rather than being a silent visual change. */}
          <div className="flex flex-wrap items-baseline gap-2" aria-live="polite">
            <span className="text-3xl font-bold text-card-foreground">{tempC}°C</span>
            <span className="text-sm text-muted-foreground">({tempF.toFixed(1)}°F)</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{t('vitals.streaming')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('vitals.patchSub')}</p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
              <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
              {t('vitals.scaleHead')}
            </h3>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {t('vitals.live')}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-card-foreground">164.2 lb</span>
            <span className="text-sm text-muted-foreground">74.5 kg</span>
            <span className="text-xs text-muted-foreground">7:00 am</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t('vitals.scale7')}</p>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-card-foreground">{t('vitals.replayHead')}</h3>
          <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-fg">
            {t('vitals.replayChip')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('vitals.replaySub')}</p>

        <button
          type="button"
          onClick={() => {
            startReplay()
            toast('▶ Replaying last night…')
          }}
          disabled={replaying}
          className="mt-3 h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {replaying ? '⏳ Replaying…' : t('vitals.replayBtn')}
        </button>

        <div
          role="log"
          aria-live="polite"
          className="mt-3 max-h-[200px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs leading-relaxed text-on-dark"
        >
          {playing.length === 0 && <p className="text-on-dark-muted">{t('vitals.replayIdle')}</p>}
          {playing.map(([time, reading, msg, cls], i) => (
            <div key={i}>
              <span className="text-on-dark-muted">{time}</span> &nbsp;{reading} —{' '}
              <span className={LINE_STYLE[cls] ?? ''}>{msg}</span>
            </div>
          ))}
        </div>

        {smsVisible && (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning-bg p-3.5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-warning-fg">
              {t('vitals.smsHead')}
            </h4>
            <p className="mt-1 text-sm text-warning-fg">
              <b>BayouCare · 2:14 am</b>
              <br />
              {/*
                Interpolated, which the legacy did NOT do: vitals.smsBody carries
                a {name} token in all four languages, and it was rendered through
                a plain data-i18n sweep that only sets textContent. So the
                caregiver SMS — the demo's closing beat — read "{name}'s temp
                patch" on screen.
              */}
              {ti('vitals.smsBody')}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
