import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import { PATIENTS, type PatientId } from '@/data'
import { usePatient } from '@/store/patient'
import { cn } from '@/lib/utils'

const PATIENT_IDS = Object.keys(PATIENTS) as PatientId[]

/**
 * Clinician “viewing as” patient picker — beUI Select instead of a native
 * `<select>` (OS menus ignore dark theme).
 */
export function PatientSelect({
  className,
  triggerClassName,
  contentClassName,
}: {
  className?: string
  triggerClassName?: string
  contentClassName?: string
}) {
  const pid = usePatient((s) => s.pid)
  const setPatient = usePatient((s) => s.setPatient)

  return (
    <Select
      value={pid}
      onValueChange={(next) => setPatient(next as PatientId)}
      className={cn('min-w-0 w-full', className)}
    >
      <SelectTrigger
        aria-label="Viewing as patient"
        className={cn(
          'h-11 gap-1.5 px-2.5 py-0 text-xs font-medium backdrop-blur-md lg:h-[34px]',
          triggerClassName,
        )}
      >
        <SelectValue className="min-w-0 truncate" placeholder="Patient" />
      </SelectTrigger>
      <SelectContent className={cn('z-50 min-w-[13rem]', contentClassName)}>
        {PATIENT_IDS.map((id) => (
          <SelectItem key={id} value={id} className="text-xs">
            {PATIENTS[id].name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
