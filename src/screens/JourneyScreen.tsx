import { Check, LoaderCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/reui/stepper'
import { useT } from '@/hooks/useT'

/**
 * Care-journey timeline. Step copy still comes from l10n; the rail/markers
 * are ReUI's vertical stepper (title + description) so the demo matches the
 * rest of the design system.
 *
 * `ACTIVE_STEP` is 1-based — Darlene's demo is in chemo (step 4 of 6).
 */
const STEPS = [
  { tw: 'journey.j1tw', td: 'journey.j1td' },
  { tw: 'journey.j2tw', td: 'journey.j2td' },
  { tw: 'journey.j3tw', td: 'journey.j3td' },
  { tw: 'journey.j4tw', td: 'journey.j4td' },
  { tw: 'journey.j5tw', td: 'journey.j5td' },
  { tw: 'journey.j6tw', td: 'journey.j6td' },
] as const

const ACTIVE_STEP = 4

export function JourneyScreen() {
  const t = useT()

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('journey.head')}</CardTitle>
          <Badge variant="success">{t('journey.chip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('journey.sub')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stepper
            defaultValue={ACTIVE_STEP}
            orientation="vertical"
            className="w-full"
            indicators={{
              completed: <Check className="size-3.5" aria-hidden="true" strokeWidth={2.5} />,
              loading: <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />,
            }}
          >
            <StepperNav className="w-full">
              {STEPS.map((step, index) => {
                const n = index + 1
                return (
                  <StepperItem
                    key={step.tw}
                    step={n}
                    className="relative items-start not-last:flex-1"
                  >
                    <StepperTrigger className="w-full items-start gap-2.5 rounded-md pb-10 last:pb-0">
                      <StepperIndicator className="data-[state=completed]:bg-success data-[state=completed]:text-white data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {n}
                      </StepperIndicator>
                      <div className="mt-0.5 min-w-0 flex-1 space-y-1 text-left">
                        <StepperTitle className="group-data-[state=inactive]/step:text-muted-foreground text-start font-semibold group-data-[state=active]/step:text-primary group-data-[state=completed]/step:text-primary">
                          {t(step.tw)}
                        </StepperTitle>
                        <StepperDescription className="text-xs leading-relaxed">
                          {t(step.td)}
                        </StepperDescription>
                      </div>
                    </StepperTrigger>
                    {n < STEPS.length ? (
                      <StepperSeparator className="group-data-[state=completed]/step:bg-success absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-2.5rem)]" />
                    ) : null}
                  </StepperItem>
                )
              })}
            </StepperNav>
          </Stepper>
        </CardContent>
      </Card>
    </div>
  )
}
