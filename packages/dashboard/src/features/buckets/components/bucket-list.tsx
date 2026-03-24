import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import type { Bucket } from "@features/buckets/types";
import {
	bucketTypeBadgeVariant,
	bucketTypeLabels,
} from "@features/buckets/types";
import { Inbox } from "lucide-react";

interface BucketListProps {
	buckets: Bucket[];
}

export function BucketList({ buckets }: BucketListProps) {
	if (buckets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
				<Inbox className="size-10 text-muted-foreground" />
				<p className="mt-4 text-sm font-medium text-foreground">
					Nenhum caixa encontrado
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Os caixas do workspace aparecerão aqui.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{buckets.map((bucket) => (
				<BucketCard key={bucket.id} bucket={bucket} />
			))}
		</div>
	);
}

function BucketCard({ bucket }: { bucket: Bucket }) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="truncate text-base">{bucket.name}</CardTitle>
					<div className="flex shrink-0 items-center gap-1.5">
						{bucket.is_default && (
							<Badge variant="default" className="gap-1">
								<Inbox className="size-3" />
								INBOX
							</Badge>
						)}
						<Badge variant={bucketTypeBadgeVariant[bucket.type]}>
							{bucketTypeLabels[bucket.type]}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-3">
					<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${bucket.allocation_percentage}%` }}
						/>
					</div>
					<span className="text-sm font-medium tabular-nums text-muted-foreground">
						{bucket.allocation_percentage}%
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
