import { Skeleton } from '@ui/skeleton'

export function IndexSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Skeleton className="h-6 w-16" />
          <div className="hidden items-center gap-6 md:flex">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="bg-grid-pattern relative flex flex-1 items-center overflow-hidden">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:gap-16 lg:py-28">
          <div className="flex flex-1 flex-col gap-6 text-center lg:text-left">
            <Skeleton className="h-6 w-64 self-center lg:self-start" />
            <Skeleton className="h-12 w-80 self-center lg:self-start" />
            <Skeleton className="h-12 w-60 self-center lg:self-start" />
            <Skeleton className="mt-2 h-5 w-96 self-center lg:self-start" />
            <Skeleton className="h-5 w-72 self-center lg:self-start" />
            <div className="mt-2 flex gap-3 self-center lg:self-start">
              <Skeleton className="h-11 w-44 rounded-md" />
              <Skeleton className="h-11 w-40 rounded-md" />
            </div>
          </div>
          <Skeleton className="hidden h-100 w-full max-w-xl rounded-lg opacity-30 lg:block" />
        </div>
      </section>

      {/* Features skeleton */}
      <section className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex flex-col items-center gap-3">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 bg-card p-6"
              >
                <Skeleton className="mb-4 size-10 rounded-md" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
