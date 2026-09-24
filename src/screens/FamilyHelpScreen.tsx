import { Users } from 'lucide-react'

import { FamilyHelpPanel } from '@/components/patient/FamilyHelpPanel'
import { InviteFamilyButton } from '@/components/patient/FamilyInviteDialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/hooks/useT'
import { useActivePatient, usePatient } from '@/store/patient'

/**
 * Family helpers hub — concrete jobs on the shared patient record.
 * New / empty charts get a clear invite callout + “keep family in the loop” copy.
 */
export function FamilyHelpScreen() {
  const t = useT()
  const pid = usePatient((s) => s.pid)
  const patient = useActivePatient()
  const isFresh = pid === 'self' || patient.family.tasks.length === 0

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-[18px] text-brand-600" aria-hidden="true" />
            {t('fam.head')}
          </CardTitle>
          <CardAction>
            <InviteFamilyButton />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="neutral">{isFresh ? t('fam.emptyChip') : t('fam.chip')}</Badge>
          <p className="text-sm text-muted-foreground">
            {isFresh ? t('fam.emptySub') : t('fam.sub')}
          </p>
        </CardContent>
      </Card>

      {isFresh ? (
        <Card className="border-brand-600/25 bg-brand-700/5">
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-base font-semibold text-card-foreground">{t('fam.emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('fam.emptyBody')}</p>
            </div>
            <InviteFamilyButton className="w-full shrink-0 sm:w-auto" />
          </CardContent>
        </Card>
      ) : null}

      <FamilyHelpPanel variant="page" />
    </div>
  )
}
