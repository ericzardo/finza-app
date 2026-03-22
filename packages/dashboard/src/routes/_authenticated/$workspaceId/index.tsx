import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getWorkspaceSummaryQueryOptions, getWorkspaceQueryOptions, } from '@lib/api-client/workspace-queries'
import { setPageMeta } from '@lib/seo'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useDateFilters } from '@features/dashboard/hooks/use-date-filters'
import { EmptyStateDashboard } from '@features/dashboard/components/empty-state-dashboard'
import { SummaryMetrics } from '@features/dashboard/components//summary-metrics'
import { AllocationChart } from '@features/dashboard/components//allocation-chart'
import { WorkspaceDashboardSkeleton } from '@features/dashboard/components//dashboard-skeleton'
import type { WorkspaceSummary } from '@lib/api-client/workspace-queries'

const searchSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
})

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export const Route = createFileRoute('/_authenticated/$workspaceId/')({
  validateSearch: searchSchema,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Home',
      description: 'Panorama financeiro consolidado do seu workspace.',
    })
  },
  loaderDeps: ({ search }) => ({
    start: search.start,
    end: search.end,
  }),
  loader: ({ context, params, deps }) => {
    const defaults = getMonthRange()
    const startDate = deps.start ?? defaults.startDate
    const endDate = deps.end ?? defaults.endDate

    return context.queryClient.ensureQueryData(
      getWorkspaceSummaryQueryOptions(params.workspaceId, { startDate, endDate }),
    )
  },
  pendingComponent: WorkspaceDashboardSkeleton,
  component: WorkspaceHomePage,
})

function isSummaryEmpty(summary: WorkspaceSummary) {
  return (
    summary.currentBalance === 0 &&
    summary.maxBalance === 0 &&
    summary.totalInvested === 0 &&
    summary.distribution.length === 0
  )
}

export function WorkspaceHomePage() {
  const { workspaceId } = useParams({ from: '/_authenticated/$workspaceId' })
  const { startDate, endDate } = useDateFilters()

  const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId))
  const currency = workspace?.currency ?? 'BRL'

  const { data: summary, isLoading } = useQuery(
    getWorkspaceSummaryQueryOptions(workspaceId, { startDate, endDate }),
  )

  if (isLoading || !summary) {
    return <WorkspaceDashboardSkeleton />
  }

  if (isSummaryEmpty(summary)) {
    return (
      <div className="shell-container py-8">
        <EmptyStateDashboard />
      </div>
    )
  }

  return (
    <div className="shell-container py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Panorama
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada do seu workspace
        </p>
      </div>

      <section className="mt-8">
        <SummaryMetrics summary={summary} currency={currency} />
      </section>

      {summary.distribution.length > 0 && (
        <section className="mt-8">
          <AllocationChart distribution={summary.distribution} currency={currency} />
        </section>
      )}
    </div>
  )
}