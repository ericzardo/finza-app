import { BucketList } from "@features/buckets/components/bucket-list";
import { BucketsSkeleton } from "@features/buckets/components/buckets-skeleton";
import type { Bucket } from "@features/buckets/types";
import { getBucketsQueryOptions, useGetBuckets } from "@finza/api-client";
import { setPageMeta } from "@lib/seo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$workspaceId/buckets/")({
	beforeLoad: () => {
		setPageMeta({
			title: "Finza | Caixas",
			description: "Visualize e gerencie os caixas do seu workspace.",
		});
	},
	loader: ({ context }) => {
		return context.queryClient.ensureQueryData(getBucketsQueryOptions());
	},
	pendingComponent: BucketsSkeleton,
	component: BucketsPage,
});

function BucketsPage() {
	const {
		data: buckets,
		isLoading,
		isError,
		refetch,
	} = useGetBuckets<Bucket[]>();

	if (isLoading) {
		return <BucketsSkeleton />;
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
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground">
					Caixas
				</h1>
				<p className="text-sm text-muted-foreground">
					Gerencie os caixas do seu workspace
				</p>
			</div>

			<section className="mt-8">
				<BucketList buckets={buckets ?? []} />
			</section>
		</div>
	);
}
