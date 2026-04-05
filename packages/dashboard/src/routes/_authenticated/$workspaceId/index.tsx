import { MonthRangePicker } from "@components/shared/month-range-picker";
import { isInvestmentBucket } from "@features/buckets/types";
import type { Bucket } from "@features/buckets/types";
import { AllocationChart } from "@features/dashboard/components/allocation-chart";
import {
	DashboardDataSkeleton,
	WorkspaceDashboardSkeleton,
} from "@features/dashboard/components/dashboard-skeleton";
import {
	EmptyStateDashboard,
	EmptyStatePeriod,
} from "@features/dashboard/components/empty-state-dashboard";
import { SummaryMetrics } from "@features/dashboard/components/summary-metrics";
import { useDateFilters } from "@features/dashboard/hooks/use-date-filters";
import { useGetBuckets } from "@finza/api-client";
import {
	getWorkspaceQueryOptions,
	getWorkspaceSummaryQueryOptions,
} from "@lib/api-client/workspace-queries";
import type { WorkspaceSummary } from "@lib/api-client/workspace-queries";
import { getMonthRange } from "@lib/date";
import { setPageMeta } from "@lib/seo";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	start: z.string().optional(),
	end: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/$workspaceId/")({
	validateSearch: searchSchema,
	beforeLoad: () => {
		setPageMeta({
			title: "Finza | Home",
			description: "Panorama financeiro consolidado do seu workspace.",
		});
	},
	loaderDeps: ({ search }) => ({
		start: search.start,
		end: search.end,
	}),
	loader: ({ context, params, deps }) => {
		const defaults = getMonthRange();
		const startDate = deps.start ?? defaults.startDate;
		const endDate = deps.end ?? defaults.endDate;

		return context.queryClient.ensureQueryData(
			getWorkspaceSummaryQueryOptions(params.workspaceId, {
				startDate,
				endDate,
			}),
		);
	},
	pendingComponent: WorkspaceDashboardSkeleton,
	component: WorkspaceHomePage,
});

function isSummaryEmpty(summary: WorkspaceSummary) {
	return (
		summary.currentBalance === 0 &&
		summary.maxBalance === 0 &&
		summary.totalInvested === 0 &&
		summary.distribution.length === 0
	);
}

export function WorkspaceHomePage() {
	const { workspaceId } = useParams({ from: "/_authenticated/$workspaceId" });
	const { startDate, endDate, setDateRange } = useDateFilters();

	const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId));
	const currency = workspace?.currency ?? "BRL";

	const { data: summary, isLoading: isSummaryLoading } = useQuery(
		getWorkspaceSummaryQueryOptions(workspaceId, { startDate, endDate }),
	);

	const { data: buckets, isLoading: isBucketsLoading } = useGetBuckets<
		Bucket[]
	>({ startDate, endDate });

	const totalInvested =
		buckets
			?.filter(isInvestmentBucket)
			.reduce((sum, b) => sum + b.period_invested, 0) ?? 0;

	const isLoading = isSummaryLoading || isBucketsLoading || !summary;

	const hasBuckets = !isLoading && (buckets?.length ?? 0) > 0;
	const isEmpty =
		!isLoading &&
		summary &&
		isSummaryEmpty(summary) &&
		(summary.pendingBalance ?? 0) === 0;

	return (
		<div className="shell-container py-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Panorama
					</h1>
					<p className="text-sm text-muted-foreground">
						Visão consolidada do seu workspace
					</p>
				</div>
				<MonthRangePicker
					startDate={startDate}
					endDate={endDate}
					onChange={setDateRange}
				/>
			</div>

			{isLoading && <DashboardDataSkeleton />}

			{!isLoading && isEmpty && !hasBuckets && <EmptyStateDashboard />}

			{!isLoading && isEmpty && hasBuckets && <EmptyStatePeriod />}

			{!isLoading && !isEmpty && summary && (
				<>
					<section className="mt-8">
						<SummaryMetrics
							currentBalance={summary.currentBalance}
							totalPending={summary.pendingBalance}
							totalInvested={totalInvested}
							currency={currency}
						/>
					</section>

					{summary.distribution.length > 0 && (
						<section className="mt-8">
							<AllocationChart
								distribution={summary.distribution}
								currency={currency}
							/>
						</section>
					)}
				</>
			)}
		</div>
	);
}
