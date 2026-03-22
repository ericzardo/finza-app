import { Card } from '@ui/card'
import { Skeleton } from '@ui/skeleton'

export function WorkspaceCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card">
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
    </Card>
  )
}
