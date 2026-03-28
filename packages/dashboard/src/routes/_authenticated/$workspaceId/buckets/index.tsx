import { Button } from "@components/ui/button";
import { BucketList } from "@features/buckets/components/bucket-list";
import {
	BucketGridSkeleton,
	BucketsSkeleton,
} from "@features/buckets/components/buckets-skeleton";
import { CreateBucketDialog } from "@features/buckets/components/create-bucket-dialog";
import { WorkspaceBudgetProgress } from "@features/buckets/components/workspace-budget-progress";
import type { Bucket } from "@features/buckets/types";
import { getBucketsQueryOptions, useGetBuckets } from "@finza/api-client";
import { useIsMobile } from "@hooks/use-mobile";
import { getWorkspaceQueryOptions } from "@lib/api-client/workspace-queries";
import { setPageMeta } from "@lib/seo";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
	start: z.string().optional(),
	end: z.string().optional(),
});

function getMonthRange() {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return {
		startDate: start.toISOString().split("T")[0],
		endDate: end.toISOString().split("T")[0],
	};
}

export const Route = createFileRoute("/_authenticated/$workspaceId/buckets/")({
	validateSearch: searchSchema,
	beforeLoad: () => {
		setPageMeta({
			title: "Finza | Caixas",
			description: "Visualize e gerencie os caixas do seu workspace.",
		});
	},
	loader: ({ context }) => {
		const { startDate, endDate } = getMonthRange();
		return context.queryClient.ensureQueryData(
			getBucketsQueryOptions({ startDate, endDate }),
		);
	},
	pendingComponent: BucketsSkeleton,
	component: BucketsPage,
});

function BucketsPage() {
	const { workspaceId } = Route.useParams();
	const { start, end } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [createOpen, setCreateOpen] = useState(false);
	const isMobile = useIsMobile();

	const defaults = getMonthRange();
	const [startDate, setStartDate] = useState(start ?? defaults.startDate);
	const [endDate, setEndDate] = useState(end ?? defaults.endDate);

	const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId));
	const currency = workspace?.currency ?? "BRL";

	const {
		data: buckets,
		isLoading,
		isError,
		refetch,
	} = useGetBuckets<Bucket[]>({ startDate, endDate });

	function handleDateChange(field: "start" | "end", value: string) {
		if (field === "start") setStartDate(value);
		else setEndDate(value);
		navigate({
			search: (prev) => ({ ...prev, [field]: value }),
			replace: true,
			resetScroll: false,
		});
	}

	if (isError) {
		return (
			<div className="shell-container py-8">
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/5 py-16 text-center">
					<p className="text-sm font-medium text-destructive">
						Erro ao carregar os caixas
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Não foi possível buscar os dados. Tente novamente.
					</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Tentar novamente
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="shell-container py-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Caixas
					</h1>
					<p className="text-sm text-muted-foreground">
						Gerencie os caixas do seu workspace
					</p>
				</div>
				<div className="flex flex-col-reverse gap-3 md:flex-row md:items-center">
					<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
						<div className="flex items-center gap-2">
							<label
								htmlFor="filter-start"
								className="text-sm font-medium text-muted-foreground"
							>
								De
							</label>
							<input
								id="filter-start"
								type="date"
								value={startDate}
								max={endDate}
								onChange={(e) => handleDateChange("start", e.target.value)}
								className="h-8 w-2/4 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 md:h-8 md:w-auto"
							/>
						</div>
						<div className="flex items-center gap-2">
							<label
								htmlFor="filter-end"
								className="text-sm font-medium text-muted-foreground"
							>
								Até
							</label>
							<input
								id="filter-end"
								type="date"
								value={endDate}
								min={startDate}
								max={new Date().toISOString().split("T")[0]}
								onChange={(e) => handleDateChange("end", e.target.value)}
								className="h-8 w-2/4 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 md:h-8 md:w-auto"
							/>
						</div>
					</div>
					<Button
						variant="accent"
						onClick={() => setCreateOpen(true)}
						size={isMobile ? "lg" : "default"}
						className="w-full shrink-0 md:w-auto"
					>
						<Plus className="size-4" />
						Criar Caixa
					</Button>
				</div>
			</div>

			{buckets && buckets.length > 0 && (
				<div className="mt-6">
					<WorkspaceBudgetProgress buckets={buckets} currency={currency} />
				</div>
			)}

			<section className="mt-6">
				{isLoading ? (
					<BucketGridSkeleton />
				) : (
					<BucketList buckets={buckets ?? []} currency={currency} />
				)}
			</section>

			<CreateBucketDialog open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
