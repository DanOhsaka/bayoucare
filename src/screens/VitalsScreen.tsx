import { useEffect, useRef } from 'react'
import { Activity, Play, Scale } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FEVER_THRESHOLD_F, REPLAY_STEPS, useVitals } from '@/store/vitals'
import { useInterval } from '@/hooks/useInterval'
import { useInterp } from '@/hooks/useInterp'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/**
 * The style token each replay line uses, from the legacy `cls` column.
 *
 * These are the `--on-dark-*` pair, not the themed `--*-fg` pair, because the
 * replay panel is `bg-brand-900` — dark green in BOTH themes. The themed
 * foregrounds invert with the theme, so in light mode the clinically meaningful
 * crit/act/ok lines rendered at 1.70–2.12:1 against that dark panel: present,
 * and unreadable. The `--on-dark-*` values are fixed for a dark surface and
 * measure 7:1 or better on it either way.
 */
const LINE_STYLE: Record<string, string> = {
  t: 'text-on-dark-muted',
  crit: 'text-on-dark-danger font-bold',
  act: 'text-on-dark-warning font-bold',
  ok: 'text-on-dark-success',
}

export function VitalsScreen() {
  const t = useT()
  const ti = useInterp()
  const smsRef = useRef<HTMLDivElement>(null)

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
  useInterval(advanceReplay, replayStep >= 0 && replaying ? 800 : null)

  // Bring the caregiver SMS into view when it is the payoff of the replay.
  useEffect(() => {
    if (!smsVisible) return
    smsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [smsVisible])

  // The played steps, which persist after the run finishes.
  const playing = REPLAY_STEPS.slice(0, replayStep)
  const tempF = (tempC * 9) / 5 + 32
  const overThreshold = tempF >= FEVER_THRESHOLD_F

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('vitals.head')}</CardTitle>
          <Badge variant="success">{t('vitals.chip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('vitals.sub')}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cn(overThreshold && 'border-danger/50')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
              {t('vitals.patchHead')}
            </CardTitle>
            <Badge variant={overThreshold ? 'danger' : 'success'}>
              <i
                className={cn(
                  'block size-1.5 rounded-full',
                  overThreshold ? 'bg-danger-fg' : 'animate-pulse bg-success-fg',
                )}
                aria-hidden="true"
              />
              {overThreshold ? t('vitals.fever') : t('vitals.live')}
            </Badge>
          </CardHeader>

          <CardContent>
            {/* aria-live so a reading that crosses the threshold is announced
                rather than being a silent visual change. */}
            <div className="flex flex-wrap items-baseline gap-2" aria-live="polite">
              <span
                className={cn(
                  'text-3xl font-bold',
                  overThreshold ? 'text-danger-fg' : 'text-card-foreground',
                )}
              >
                {tempF.toFixed(1)}°F
              </span>
              <span className="text-sm text-muted-foreground">({tempC.toFixed(1)}°C)</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{t('vitals.streaming')}</p>
            <p
              className={cn(
                'mt-2 text-sm',
                overThreshold ? 'font-semibold text-danger-fg' : 'text-muted-foreground',
              )}
            >
              {overThreshold
                ? t('vitals.thresholdHot')
                : ti('vitals.thresholdOk', { temp: tempF.toFixed(1) })}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t('vitals.patchSub')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
              {t('vitals.scaleHead')}
            </CardTitle>
            <Badge variant="neutral">{t('vitals.thisMorning')}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-card-foreground">164.2 lb</span>
              <span className="text-sm text-muted-foreground">74.5 kg</span>
              <span className="text-xs text-muted-foreground">7:00 am</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('vitals.scale7')}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t('vitals.scaleSub')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('vitals.replayHead')}</CardTitle>
          <Badge variant="neutral">{t('vitals.replayChip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('vitals.replaySub')}</p>

          <Button
            type="button"
            size="lg"
            className="mt-3 font-bold"
            onClick={() => {
              startReplay()
              toast(t('vitals.replayBusy'))
            }}
            disabled={replaying}
          >
            <Play className="size-4" aria-hidden="true" />
            {replaying ? t('vitals.replayBusy') : t('vitals.replayBtn')}
          </Button>

          <div
            role="log"
            aria-live="polite"
            className="mt-3 max-h-[200px] overflow-y-auto rounded-md bg-brand-900 p-3 font-mono text-xs leading-relaxed text-on-dark"
          >
            {playing.length === 0 ? (
              <p className="text-on-dark-muted">{t('vitals.replayIdle')}</p>
            ) : (
              playing.map(([time, reading, msg, cls], i) => (
                <div key={i}>
                  <span className="text-on-dark-muted">{time}</span> &nbsp;{reading} —{' '}
                  <span className={LINE_STYLE[cls] ?? ''}>{msg}</span>
                </div>
              ))
            )}
          </div>

          {smsVisible && (
            <div
              ref={smsRef}
              className="mt-4 rounded-lg border border-warning/40 bg-warning-bg p-3.5"
            >
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
        </CardContent>
      </Card>
    </div>
  )
}
