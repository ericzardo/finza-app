import { BucketCard } from "@features/buckets/components/bucket-card";
import type { Bucket } from "@features/buckets/types";
import { Inbox } from "lucide-react";

interface BucketListProps {
	buckets: Bucket[];
	currency: string;
}

export function BucketList({ buckets, currency }: BucketListProps) {
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
				<BucketCard key={bucket.id} bucket={bucket} currency={currency} />
			))}
		</div>
	);
}
