import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'

import { CdsSection } from './clinicops/CdsSection'
import { PriorAuthSection } from './clinicops/PriorAuthSection'
import { ReferralSection } from './clinicops/ReferralSection'
import { SlotBoardSection } from './clinicops/SlotBoardSection'
import { TumorBoardSection } from './clinicops/TumorBoardSection'

/**
 * Clinic Ops — the provider side of the same system (Ranks 9–13, brief area 5).
 *
 * Five administrative workflows, each its own section in `./clinicops/`. The
 * screen is an orchestrator and nothing else: all state lives in `useClinic`,
 * and every risk number any section shows is derived from `useTeam`'s applied
 * counterfactuals rather than recomputed here — so the Care Team tab and this
 * one cannot drift apart.
 *
 * This is an ADMIN surface, so it renders in English regardless of the
 * selected locale. That is deliberate and matches the legacy: clinical systems
 * are English, and the app says so on the card below.
 */
export function ClinicOpsScreen() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              🏥 Clinic ops — the provider side of the same system
            </CardTitle>
            <CardAction>
              <Badge variant="success" className="text-left whitespace-normal">
                Ranks 9–13 · brief area 5 · synthetic data
              </Badge>
            </CardAction>
          </CardHeader>
          <p className="text-sm text-muted-foreground">
            Five administrative workflows that decide whether a patient actually gets
            treated — authorization, tumor board, referral, screening outreach, and the
            schedule itself.{' '}
            <b className="text-foreground">
              Every module reads the same engine as the patient app:
            </b>{' '}
            the risk numbers here are Rank 1&apos;s logistic model and Rank 3&apos;s
            screening engines, not a parallel demo model. These are provider-facing
            surfaces and stay in English, as clinical systems do.
          </p>
        </Card>

        <PriorAuthSection />
        <TumorBoardSection />
        <ReferralSection />
        <CdsSection />
        <SlotBoardSection />
      </div>
    </div>
  )
}
