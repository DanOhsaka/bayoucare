import { useMemo } from 'react'
import { Leaf } from 'lucide-react'

import { RemiChat } from '@/components/ai/RemiChat'
import { Button as MovingBorder } from '@/components/ui/moving-border'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'
import { TypewriterEffect } from '@/components/ui/typewriter-effect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useInterp } from '@/hooks/useInterp'
import { useT } from '@/hooks/useT'
import { useRemi } from '@/store/remi'

const PROMPT_KEYS = ['remi.q1', 'remi.q2', 'remi.q3', 'remi.q4'] as const

function PartnerChip({ label }: { label: string }) {
  return (
    <MovingBorder
      as="div"
      borderRadius="9999px"
      duration={2500}
      containerClassName="h-auto w-auto min-w-0 p-[1px]"
      borderClassName="h-16 w-16 bg-[radial-gradient(#f97316_40%,transparent_60%)] opacity-90"
      className="border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-800 antialiased dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200"
    >
      {label}
    </MovingBorder>
  )
}

/**
 * Ask Remi — Aceternity-style vanish input hero until the first question,
 * then the full chat thread.
 */
export function RemiScreen() {
  const t = useT()
  const interp = useInterp()
  const send = useRemi((s) => s.send)
  const busy = useRemi((s) => s.busy)
  const messages = useRemi((s) => s.messages)
  const started = messages.some((m) => m.role === 'user')

  const placeholders = PROMPT_KEYS.map((k) => t(k))
  const typeGreet = interp('remi.typeGreet')
  const typeWords = useMemo(
    () =>
      typeGreet
        .split(/\s+/)
        .filter(Boolean)
        .map((text) => ({ text, className: 'text-foreground' })),
    [typeGreet],
  )

  if (!started) {
    return (
      <div className="flex min-h-[min(72dvh,640px)] min-w-0 flex-col items-center justify-center gap-8 rounded-xl border border-border bg-card px-4 py-14 shadow-[var(--shadow)] sm:gap-10 sm:px-8 dark:bg-zinc-950">
        <div className="flex max-w-xl flex-col items-center gap-3 text-center">
          <PartnerChip label={t('remi.chipLive')} />
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground font-display sm:text-4xl md:text-5xl">
            {t('remi.askAnything')}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">{t('remi.sub')}</p>
        </div>

        <TypewriterEffect
          words={typeWords}
          className="max-w-xl font-display text-base font-medium sm:text-lg md:text-xl lg:text-xl"
          cursorClassName="h-4 bg-brand-500 md:h-5 lg:h-5"
        />

        <div className="w-full max-w-xl">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onSubmit={(_e, value) => {
              if (!value || busy) return
              void send(value)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="items-start gap-2">
          <CardTitle className="flex min-w-0 max-w-full items-start gap-2 text-base leading-snug sm:text-lg">
            <Leaf className="mt-0.5 size-[18px] flex-none text-brand-600" aria-hidden="true" />
            <span className="min-w-0 break-words">{t('remi.head')}</span>
          </CardTitle>
          <PartnerChip label={t('remi.chipLive')} />
        </CardHeader>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0">
          <RemiChat />
        </CardContent>
      </Card>
    </div>
  )
}
