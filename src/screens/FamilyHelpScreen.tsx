import { Users } from 'lucide-react'

import { FamilyHelpPanel } from '@/components/patient/FamilyHelpPanel'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/hooks/useT'

/**
 * Family helpers hub — concrete jobs on the shared patient record.
 * Replaces the old global "Caregiver mode" toggle.
 */
export function FamilyHelpScreen() {
  const t = useT()

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-[18px] text-brand-600" aria-hidden="true" />
            {t('fam.head')}
          </CardTitle>
          <Badge variant="neutral">{t('fam.chip')}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('fam.sub')}</p>
        </CardContent>
      </Card>

      <FamilyHelpPanel variant="page" />
    </div>
  )
}
