import type { PrismaClient } from "@prisma/client";
import type {
	BucketWithAggregates,
	InboxBucketItem,
	InvestmentBucketItem,
	SpendingBucketItem,
} from "./create-bucket";
import { serializeBucket } from "./create-bucket";

interface ListBucketsInput {
	workspaceId: string;
	startDate?: string;
	endDate?: string;
}

export async function listBuckets(
	db: PrismaClient,
	{ workspaceId, startDate, endDate }: ListBucketsInput,
): Promise<BucketWithAggregates[]> {
	const dateFilter =
		startDate || endDate
			? {
					gte: startDate ? new Date(`${startDate}T00:00:00.000Z`) : undefined,
					lte: endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined,
				}
			: undefined;

	const buckets = await db.bucket.findMany({
		where: { workspace_id: workspaceId },
		orderBy: { created_at: "asc" },
	});

	const spendingIds = buckets
		.filter((b) => b.type === "SPENDING")
		.map((b) => b.id);
	const investmentIds = buckets
		.filter((b) => b.type === "INVESTMENT")
		.map((b) => b.id);
	const inboxIds = buckets.filter((b) => b.type === "INBOX").map((b) => b.id);

	const [
		spendingHistoricalAgg,
		spendingPeriodAgg,
		investmentHistoricalAgg,
		investmentPeriodAgg,
		workspacePeriodIncome,
		inboxHistoricalAgg,
		inboxPeriodAgg,
	] = await Promise.all([
		// SPENDING: agregação histórica (net = income - expense)
		spendingIds.length > 0
			? db.transaction.groupBy({
					by: ["bucket_id", "type"],
					where: {
						bucket_id: { in: spendingIds },
						canceled_at: null,
					},
					_sum: { amount: true },
				})
			: Promise.resolve([]),

		// SPENDING: agregação do período
		spendingIds.length > 0 && dateFilter
			? db.transaction.groupBy({
					by: ["bucket_id", "type"],
					where: {
						bucket_id: { in: spendingIds },
						canceled_at: null,
						date: dateFilter,
					},
					_sum: { amount: true },
				})
			: Promise.resolve([]),

		// INVESTMENT: agregação histórica (total aportado = expense)
		investmentIds.length > 0
			? db.transaction.aggregate({
					where: {
						bucket_id: { in: investmentIds },
						type: "EXPENSE",
						canceled_at: null,
					},
					_sum: { amount: true },
					// groupBy individual por bucket
				})
			: Promise.resolve(null),

		// INVESTMENT: agregação do período por bucket
		investmentIds.length > 0 && dateFilter
			? db.transaction.groupBy({
					by: ["bucket_id"],
					where: {
						bucket_id: { in: investmentIds },
						type: "EXPENSE",
						canceled_at: null,
						date: dateFilter,
					},
					_sum: { amount: true },
				})
			: Promise.resolve([]),

		// Receita total do workspace no período (base para period_target)
		dateFilter
			? db.transaction.aggregate({
					where: {
						workspace_id: workspaceId,
						type: "INCOME",
						canceled_at: null,
						date: dateFilter,
					},
					_sum: { amount: true },
				})
			: Promise.resolve(null),

		// INBOX: agregação histórica (net = income - expense)
		inboxIds.length > 0
			? db.transaction.groupBy({
					by: ["bucket_id", "type"],
					where: {
						bucket_id: { in: inboxIds },
						canceled_at: null,
					},
					_sum: { amount: true },
				})
			: Promise.resolve([]),

		// INBOX: agregação do período
		inboxIds.length > 0 && dateFilter
			? db.transaction.groupBy({
					by: ["bucket_id", "type"],
					where: {
						bucket_id: { in: inboxIds },
						canceled_at: null,
						date: dateFilter,
					},
					_sum: { amount: true },
				})
			: Promise.resolve([]),
	]);

	// Para investment, precisamos agrupar historical por bucket_id também
	const investmentHistoricalByBucket =
		investmentIds.length > 0
			? await db.transaction.groupBy({
					by: ["bucket_id"],
					where: {
						bucket_id: { in: investmentIds },
						type: "EXPENSE",
						canceled_at: null,
					},
					_sum: { amount: true },
				})
			: [];

	const workspaceIncomeInPeriod = workspacePeriodIncome
		? toNumber(workspacePeriodIncome._sum.amount)
		: 0;

	return buckets.map((bucket): BucketWithAggregates => {
		const base = serializeBucket(bucket);

		if (bucket.type === "INBOX") {
			type AggRow = {
				bucket_id: string | null;
				type: string;
				_sum: { amount: { toNumber(): number } | number | null };
			};

			const historicalRows = (inboxHistoricalAgg as AggRow[]).filter(
				(r) => r.bucket_id === bucket.id,
			);
			const historicalIncome = toNumber(
				historicalRows.find((r) => r.type === "INCOME")?._sum.amount,
			);
			const historicalExpense = toNumber(
				historicalRows.find((r) => r.type === "EXPENSE")?._sum.amount,
			);

			const periodRows = (inboxPeriodAgg as AggRow[]).filter(
				(r) => r.bucket_id === bucket.id,
			);
			const periodIncome = toNumber(
				periodRows.find((r) => r.type === "INCOME")?._sum.amount,
			);
			const periodExpense = toNumber(
				periodRows.find((r) => r.type === "EXPENSE")?._sum.amount,
			);

			return {
				...base,
				type: "INBOX",
				current_amount: round(historicalIncome - historicalExpense),
				period_income: round(periodIncome),
				period_spent: round(periodExpense),
			} satisfies InboxBucketItem;
		}

		if (bucket.type === "SPENDING") {
			const historicalRows = (
				spendingHistoricalAgg as Array<{
					bucket_id: string | null;
					type: string;
					_sum: { amount: { toNumber(): number } | number | null };
				}>
			).filter((r) => r.bucket_id === bucket.id);

			const historicalIncome = toNumber(
				historicalRows.find((r) => r.type === "INCOME")?._sum.amount,
			);
			const historicalExpense = toNumber(
				historicalRows.find((r) => r.type === "EXPENSE")?._sum.amount,
			);

			const periodRows = (
				spendingPeriodAgg as Array<{
					bucket_id: string | null;
					type: string;
					_sum: { amount: { toNumber(): number } | number | null };
				}>
			).filter((r) => r.bucket_id === bucket.id);

			const periodIncome = toNumber(
				periodRows.find((r) => r.type === "INCOME")?._sum.amount,
			);
			const periodExpense = toNumber(
				periodRows.find((r) => r.type === "EXPENSE")?._sum.amount,
			);

			return {
				...base,
				type: "SPENDING",
				current_amount: round(historicalIncome - historicalExpense),
				period_allocated: round(periodIncome),
				period_spent: round(periodExpense),
			} satisfies SpendingBucketItem;
		}

		// INVESTMENT
		const historicalRow = investmentHistoricalByBucket.find(
			(r) => r.bucket_id === bucket.id,
		);
		const periodRow = (
			investmentPeriodAgg as Array<{
				bucket_id: string | null;
				_sum: { amount: { toNumber(): number } | number | null };
			}>
		).find((r) => r.bucket_id === bucket.id);

		const allocationPct = base.allocation_percentage / 100;
		const periodTarget = round(workspaceIncomeInPeriod * allocationPct);

		return {
			...base,
			type: "INVESTMENT",
			current_invested: round(toNumber(historicalRow?._sum.amount)),
			period_target: periodTarget,
			period_invested: round(toNumber(periodRow?._sum.amount)),
		} satisfies InvestmentBucketItem;
	});
}

function toNumber(
	val: { toNumber(): number } | number | null | undefined,
): number {
	if (val == null) return 0;
	if (typeof val === "number") return val;
	return val.toNumber();
}

function round(val: number): number {
	return Math.round(val * 100) / 100;
}
