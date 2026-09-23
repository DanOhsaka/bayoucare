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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="size-[18px] text-brand-600" aria-hidden="true" />
            {t('remi.head')}
          </CardTitle>
          <Badge variant="success">
            <i className="block size-1.5 rounded-full bg-current" aria-hidden="true" />
            {t('remi.chipLive')}
          </Badge>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">{t('remi.sub')}</p>

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

      <Card>
        <CardContent>
          <RemiChat />
        </CardContent>
      </Card>
    </div>
  )
}
