import { toast } from 'sonner'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import { LANG_TOAST } from '@/data'
import { LANGS, LANG_LABELS, LANG_SHORT, type Lang } from '@/lib/i18n'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * App language picker — beUI Select (animated panel) instead of a native
 * `<select>`, whose OS menu ignores dark theme and rounded chrome.
 */
export function LanguageSelect({
  className,
  triggerClassName,
  contentClassName,
  compact = false,
}: {
  className?: string
  triggerClassName?: string
  contentClassName?: string
  /** Tighter trigger for the sticky header row. */
  compact?: boolean
}) {
  const lang = useUi((s) => s.lang)
  const setLang = useUi((s) => s.setLang)

  return (
    <Select
      value={lang}
      onValueChange={(next) => {
        const l = next as Lang
        setLang(l)
        toast(LANG_TOAST[l] ?? LANG_TOAST.en)
      }}
      className={cn(
        compact ? 'w-[11.5rem] shrink-0' : 'w-full min-w-[10.5rem]',
        className,
      )}
    >
      <SelectTrigger
        aria-label="Language"
        className={cn(
          compact &&
            'h-11 gap-1.5 px-2.5 py-0 text-xs font-medium backdrop-blur-md lg:h-[34px]',
          !compact && 'text-xs font-medium',
          triggerClassName,
        )}
      >
        <SelectValue
          className={cn(compact && 'min-w-0 truncate')}
          placeholder="Language"
        />
      </SelectTrigger>
      <SelectContent className={cn('z-50 min-w-[11.5rem]', contentClassName)}>
        {LANGS.map((l) => (
          <SelectItem key={l} value={l} className="text-xs">
            {`${LANG_SHORT[l]} · ${LANG_LABELS[l]}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
