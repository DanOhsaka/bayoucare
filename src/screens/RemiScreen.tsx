import { Leaf } from 'lucide-react'

import { RemiChat } from '@/components/ai/RemiChat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRemi } from '@/store/remi'
import { useT } from '@/hooks/useT'

const PROMPT_KEYS = ['remi.q1', 'remi.q2', 'remi.q3', 'remi.q4']

export function RemiScreen() {
  const t = useT()
  const send = useRemi((s) => s.send)
  const busy = useRemi((s) => s.busy)

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="items-start gap-2">
          <CardTitle className="flex min-w-0 max-w-full items-start gap-2 text-base leading-snug sm:text-lg">
            <Leaf className="mt-0.5 size-[18px] flex-none text-brand-600" aria-hidden="true" />
            <span className="min-w-0 break-words">{t('remi.head')}</span>
          </CardTitle>
          <Badge variant="success" className="max-w-full shrink-0 whitespace-normal text-left">
            <i className="block size-1.5 flex-none rounded-full bg-current" aria-hidden="true" />
            {t('remi.chipLive')}
          </Badge>
        </CardHeader>

        <CardContent className="min-w-0">
          <p className="text-sm font-medium leading-relaxed text-muted-foreground">{t('remi.sub')}</p>

          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            {PROMPT_KEYS.map((k) => (
              <Button
                key={k}
                type="button"
                variant="outline"
                size="xs"
                disabled={busy}
                onClick={() => void send(t(k))}
                className="h-auto max-w-full whitespace-normal rounded-full px-3 py-2 text-left font-semibold leading-snug"
              >
                {t(k)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0">
          <RemiChat />
        </CardContent>
      </Card>
    </div>
  )
}
