import { Header } from '@components/layout/header'
import { Skeleton } from '@ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-34 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  )
}