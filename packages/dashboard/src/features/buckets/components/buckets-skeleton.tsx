import { Card, CardContent, CardHeader } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";

export function BucketGridSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<Card key={`skeleton-${i.toString()}`}>
					<CardHeader className="pb-3">
						<div className="flex items-start gap-3">
							<Skeleton className="size-9 shrink-0 rounded-lg" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-3 w-40" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-1.5">
								<Skeleton className="h-2.5 w-16" />
								<Skeleton className="h-8 w-32" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-3 w-36" />
								<Skeleton className="h-3 w-36" />
							</div>
						</div>
						<div className="space-y-1.5">
							<div className="flex justify-between">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-3 w-8" />
							</div>
							<Skeleton className="h-1.5 w-full rounded-full" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function BucketsSkeleton() {
	return (
		<div className="shell-container py-8">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-9 w-32 rounded-md" />
			</div>

			<div className="mt-6 rounded-lg border border-border bg-card p-4">
				<div className="mb-3 flex items-center justify-between gap-4">
					<Skeleton className="h-4 w-56" />
					<Skeleton className="h-4 w-32" />
				</div>
				<Skeleton className="h-1.5 w-full rounded-full" />
				<Skeleton className="mt-2 h-3 w-72" />
			</div>

			<div className="mt-6 flex gap-3">
				<Skeleton className="h-8 w-36 rounded-lg" />
				<Skeleton className="h-8 w-36 rounded-lg" />
			</div>

			<div className="mt-6">
				<BucketGridSkeleton />
			</div>
		</div>
	);
}
