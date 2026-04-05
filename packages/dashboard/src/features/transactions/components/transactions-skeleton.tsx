import { Skeleton } from "@components/ui/skeleton";

export function TransactionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border bg-muted/50 px-4 py-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-32 flex-1" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="hidden h-3 w-16 md:block" />
        <Skeleton className="hidden h-3 w-24 md:block" />
      </div>
      {/* Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`skeleton-row-${i.toString()}`}
          className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
        >
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
          <Skeleton className="hidden h-4 w-28 md:block" />
        </div>
      ))}
    </div>
  );
}

export function InternalTransactionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="hidden items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 md:flex">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-32 flex-1" />
        <Skeleton className="h-3 w-32 flex-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`internal-skeleton-row-${i.toString()}`}
          className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
        >
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-28 flex-1" />
          <Skeleton className="hidden h-4 w-28 flex-1 md:block" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function TabsListSkeleton() {
  return (
    <div className="mt-6 flex items-center gap-1">
      <Skeleton className="h-7 w-28 rounded-md" />
      <Skeleton className="h-7 w-44 rounded-md" />
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="shell-container py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>

      <TabsListSkeleton />

      <div className="mt-4">
        <TransactionsTableSkeleton />
      </div>
    </div>
  );
}
