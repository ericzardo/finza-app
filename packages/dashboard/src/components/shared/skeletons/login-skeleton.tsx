import { Skeleton } from '@ui/skeleton'

export function LoginSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Lado Esquerdo — Branding skeleton */}
      <aside className="relative hidden w-[60%] flex-col justify-between overflow-hidden bg-zinc-900 p-10 dark:bg-zinc-950 lg:flex">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0" />
        <Skeleton className="h-6 w-16" />
        <div className="max-w-md space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
      </aside>

      {/* Lado Direito — Formulário skeleton */}
      <main className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-[40%]">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="flex flex-col gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-1 h-11 w-full rounded-md" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
      </main>
    </div>
  )
}
