import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MapLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-busy="true">
      <Skeleton className="min-h-[320px] w-full rounded-lg lg:min-h-[420px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function MapEmptyState({ onExpand }: { onExpand?: () => void }) {
  return (
    <EmptyState
      icon={MapPin}
      title="No nearby clinics found"
      description="Try expanding your search area or searching near another city."
      action={
        onExpand ? (
          <Button type="button" variant="outline" size="sm" onClick={onExpand}>
            Show a wider area
          </Button>
        ) : undefined
      }
    />
  )
}

export function MapErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="We couldn't load nearby clinics right now"
      description="Check your connection and try again. Your care team can also help find a location."
      action={
        <Button type="button" onClick={onRetry} className="font-bold">
          Try again
        </Button>
      }
    />
  )
}
