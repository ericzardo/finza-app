import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
	type Bucket,
	type InboxBucket,
	type InvestmentBucket,
	type SpendingBucket,
	bucketTypeLabels,
	isInboxBucket,
	isInvestmentBucket,
	isSpendingBucket,
} from "@features/buckets/types";
import { Sensitive } from "@features/user/components/sensitive-value";
import { formatCurrency } from "@lib/utils";
import { Inbox, TrendingDown, TrendingUp } from "lucide-react";

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
			{buckets.map((bucket) => {
				if (isInboxBucket(bucket)) {
					return (
						<InboxBucketCard
							key={bucket.id}
							bucket={bucket}
							currency={currency}
						/>
					);
				}
				if (isSpendingBucket(bucket)) {
					return (
						<SpendingBucketCard
							key={bucket.id}
							bucket={bucket}
							currency={currency}
						/>
					);
				}
				if (isInvestmentBucket(bucket)) {
					return (
						<InvestmentBucketCard
							key={bucket.id}
							bucket={bucket}
							currency={currency}
						/>
					);
				}
				return null;
			})}
		</div>
	);
}

function InboxBucketCard({
	bucket,
	currency,
}: {
	bucket: InboxBucket;
	currency: string;
}) {
	const spentRatio =
		bucket.period_income > 0
			? Math.min(bucket.period_spent / bucket.period_income, 1)
			: 0;
	const spentPct = Math.round(spentRatio * 100);

	return (
		<Card className="relative overflow-hidden">
			<div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
			<CardHeader className="pb-3">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
						<Inbox className="size-4 text-amber-600 dark:text-amber-400" />
					</div>
					<div className="min-w-0 flex-1">
						<CardTitle className="truncate text-base">{bucket.name}</CardTitle>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Dinheiro aguardando destinação
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							Saldo Atual
						</p>
						<Sensitive className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">
							{formatCurrency(bucket.current_amount, currency)}
						</Sensitive>
					</div>
					<div className="shrink-0 space-y-1.5">
						<div className="flex items-center justify-between gap-6">
							<span className="text-xs text-muted-foreground">Entradas</span>
							<Sensitive className="text-xs font-medium tabular-nums text-foreground">
								{formatCurrency(bucket.period_income, currency)}
							</Sensitive>
						</div>
						<div className="flex items-center justify-between gap-6">
							<span className="text-xs text-muted-foreground">Saídas</span>
							<Sensitive className="text-xs font-medium tabular-nums text-foreground">
								{formatCurrency(bucket.period_spent, currency)}
							</Sensitive>
						</div>
					</div>
				</div>

				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							Distribuído no período
						</span>
						<span className="text-xs font-medium tabular-nums text-muted-foreground">
							{spentPct}%
						</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-amber-500 transition-all dark:bg-amber-400"
							style={{ width: `${spentPct}%` }}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function SpendingBucketCard({
	bucket,
	currency,
}: {
	bucket: SpendingBucket;
	currency: string;
}) {
	const usageRatio =
		bucket.period_allocated > 0
			? Math.min(bucket.period_spent / bucket.period_allocated, 1)
			: 0;
	const usagePct = Math.round(usageRatio * 100);
	const isOverBudget =
		bucket.period_spent > bucket.period_allocated &&
		bucket.period_allocated > 0;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
						<TrendingDown className="size-4 text-muted-foreground" />
					</div>
					<div className="min-w-0 flex-1">
						<CardTitle className="truncate text-base">{bucket.name}</CardTitle>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{bucketTypeLabels.SPENDING} · {bucket.allocation_percentage}% da
							receita
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							Saldo Atual
						</p>
						<Sensitive className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">
							{formatCurrency(bucket.current_amount, currency)}
						</Sensitive>
					</div>
					<div className="shrink-0 space-y-1.5">
						<div className="flex items-center justify-between gap-6">
							<span className="text-xs text-muted-foreground">Gasto</span>
							<span
								className={`text-xs font-medium tabular-nums ${isOverBudget ? "text-destructive" : "text-foreground"}`}
							>
								{formatCurrency(bucket.period_spent, currency)}
							</span>
						</div>
						<div className="flex items-center justify-between gap-6">
							<span className="text-xs text-muted-foreground">Limite</span>
							<span className="text-xs font-medium tabular-nums text-foreground">
								{formatCurrency(bucket.period_allocated, currency)}
							</span>
						</div>
					</div>
				</div>

				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							Uso do período
						</span>
						<span
							className={`text-xs font-medium tabular-nums ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}
						>
							{usagePct}%
						</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : "bg-primary"}`}
							style={{ width: `${usagePct}%` }}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function InvestmentBucketCard({
	bucket,
	currency,
}: {
	bucket: InvestmentBucket;
	currency: string;
}) {
	const progressRatio =
		bucket.period_target > 0
			? Math.min(bucket.period_invested / bucket.period_target, 1)
			: 0;
	const progressPct = Math.round(progressRatio * 100);
	const isGoalReached = progressPct >= 100;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
						<TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div className="min-w-0 flex-1">
						<CardTitle className="truncate text-base">{bucket.name}</CardTitle>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{bucketTypeLabels.INVESTMENT} · {bucket.allocation_percentage}% da
							receita
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							Total Aportado
						</p>
						<Sensitive className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">
							{formatCurrency(bucket.current_invested, currency)}
						</Sensitive>
					</div>
					<div className="shrink-0 space-y-1.5">
						<div className="flex items-center justify-between gap-6">
							<span className="text-xs text-muted-foreground">Aportado</span>
							<Sensitive
								className={`text-xs font-medium tabular-nums ${isGoalReached ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}
							>
								{formatCurrency(bucket.period_invested, currency)}
							</Sensitive>
						</div>
						<div className="flex items-center justify-between gap-6">
							<span className="text-xs text-muted-foreground">Meta</span>
							<Sensitive className="text-xs font-medium tabular-nums text-foreground">
								{formatCurrency(bucket.period_target, currency)}
							</Sensitive>
						</div>
					</div>
				</div>

				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							Meta do período
						</span>
						<span
							className={`text-xs font-medium tabular-nums ${isGoalReached ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
						>
							{progressPct}%
						</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className={`h-full rounded-full transition-all ${isGoalReached ? "bg-emerald-500 dark:bg-emerald-400" : "bg-emerald-600/70 dark:bg-emerald-500/70"}`}
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
