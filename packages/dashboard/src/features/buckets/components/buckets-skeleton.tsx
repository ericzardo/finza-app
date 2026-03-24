import { Card, CardContent, CardHeader } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";

export function BucketsSkeleton() {
	return (
		<div className="shell-container py-8">
			<div className="space-y-1">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={`skeleton-${i.toString()}`}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<Skeleton className="h-5 w-28" />
								<Skeleton className="h-5 w-20 rounded-full" />
							</div>
						</CardHeader>
						<CardContent>
							<Skeleton className="h-4 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
