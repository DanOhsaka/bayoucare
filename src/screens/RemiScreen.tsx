import { useState } from 'react'
import { Leaf, Settings2 } from 'lucide-react'

import { RemiChat } from '@/components/ai/RemiChat'
import { Field, INPUT_CLASS } from '@/components/shared/Field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { REMI_PROVIDERS } from '@/engine/remi/providers'
import { useRemi } from '@/store/remi'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

const PROMPT_KEYS = ['remi.q1', 'remi.q2', 'remi.q3', 'remi.q4']

export function RemiScreen() {
  const t = useT()
  const send = useRemi((s) => s.send)
  const busy = useRemi((s) => s.busy)
  const key = useRemi((s) => s.key)
  const provider = useRemi((s) => s.provider)
  const saveKey = useRemi((s) => s.saveKey)
  const clearKey = useRemi((s) => s.clearKey)

  const [draftKey, setDraftKey] = useState('')

  const engineLabel = key
    ? `${REMI_PROVIDERS[provider].label} ${t('remi.chipConnected')}`
    : t('remi.chipLocal')

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------------- header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="size-[18px] text-brand-600" aria-hidden="true" />
            Remi — your care assistant
          </CardTitle>
          <Badge variant={key ? 'success' : 'neutral'}>
            <i className="block size-1.5 rounded-full bg-current" aria-hidden="true" />
            {engineLabel}
          </Badge>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">{t('remi.sub')}</p>

          {/* Suggestions, not controls: each one sends its own question. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PROMPT_KEYS.map((k) => (
              <Button
                key={k}
                type="button"
                variant="outline"
                size="xs"
                disabled={busy}
                onClick={() => void send(t(k))}
                className="rounded-full font-semibold"
              >
                {t(k)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* --------------------------------------------------------- conversation */}
      <Card>
        <CardContent>
          <RemiChat />
        </CardContent>
      </Card>

      {/* ------------------------------------------------------ connect a model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
            {t('remi.connectHead')}
          </CardTitle>
          <Badge variant="neutral">{t('remi.connectChip')}</Badge>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">{t('remi.connectSub')}</p>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <Field label="API key" id="remi-key">
                <input
                  id="remi-key"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="sk-…"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  className={cn(INPUT_CLASS, 'font-mono')}
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                saveKey(draftKey.trim())
                setDraftKey('')
              }}
              disabled={!draftKey.trim()}
              className="border-brand-600 font-bold text-link hover:text-link dark:border-brand-600"
            >
              {t('remi.connectSave')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                clearKey()
                setDraftKey('')
              }}
              className="font-bold"
            >
              {t('remi.connectClear')}
            </Button>
          </div>

          {/*
            The key is kept in this browser only. It must never move into an
            `import.meta.env.VITE_*` variable: Vite inlines any VITE_-prefixed
            value into the public bundle, which would publish the key in the
            JavaScript every visitor downloads.
          */}
          <p className="mt-2 text-xs text-muted-foreground">
            {key ? t('remi.keySaved') : t('remi.keyNone')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
