import { Skeleton } from '@ui/skeleton'

export function WorkspaceDashboardSkeleton() {
  return (
    <div className="shell-container py-8">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-stone-50 p-5 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="mt-8 rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-56" />
        <div className="mt-4 flex flex-col items-center gap-6 lg:flex-row">
          <Skeleton className="size-52 shrink-0 rounded-full" />
          <div className="flex-1 space-y-4 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-2.5 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
