import {
	BucketType,
	InternalType,
	type Prisma,
	type PrismaClient,
	TransactionType,
} from "@prisma/client";

export interface BucketDistributionItem {
	bucketId: string;
	bucketName: string;
	bucketType: string;
	amount: number;
	percentage: number;
}

export interface GetWorkspaceSummaryResult {
	totalBalance: number;
	currentBalance: number;
	maxBalance: number;
	totalInvested: number;
	pendingBalance: number;
	distribution: BucketDistributionItem[];
}

function safeNumber(val: unknown): number {
	if (val == null) return 0;
	const n = Number(val);
	return Number.isNaN(n) ? 0 : n;
}

const summaryInternalTypeOr = [
	{ internal_type: null as null },
	{ internal_type: InternalType.BALANCE_ADJUSTMENT },
];

function buildGlobalSummaryWhere(
	workspaceId: string,
	options: {
		isPaid?: boolean;
		bucketIds?: string[];
		requireBucket?: boolean;
		typeIn?: TransactionType[];
		maxDate?: Date;
	} = {},
): Prisma.TransactionWhereInput {
	return {
		workspace_id: workspaceId,
		canceled_at: null,
		OR: summaryInternalTypeOr,
		...(options.isPaid !== undefined ? { is_paid: options.isPaid } : {}),
		...(options.bucketIds ? { bucket_id: { in: options.bucketIds } } : {}),
		...(options.requireBucket ? { bucket_id: { not: null } } : {}),
		...(options.typeIn ? { type: { in: options.typeIn } } : {}),
		...(options.maxDate ? { date: { lte: options.maxDate } } : {}),
	};
}

function buildBucketBalanceWhere(
	workspaceId: string,
	options: {
		isPaid?: boolean;
		bucketIds?: string[];
		requireBucket?: boolean;
	} = {},
): Prisma.TransactionWhereInput {
	return {
		workspace_id: workspaceId,
		canceled_at: null,
		...(options.isPaid !== undefined ? { is_paid: options.isPaid } : {}),
		...(options.bucketIds ? { bucket_id: { in: options.bucketIds } } : {}),
		...(options.requireBucket ? { bucket_id: { not: null } } : {}),
	};
}

function applyBucketAmount(
	bucketAmountMap: Map<string, number>,
	bucketTypeMap: Map<string, BucketType>,
	bucketId: string,
	transactionType: TransactionType,
	rawAmount: unknown,
) {
	const current = bucketAmountMap.get(bucketId) ?? 0;
	const amount = safeNumber(rawAmount);
	const isInvestment = bucketTypeMap.get(bucketId) === BucketType.INVESTMENT;

	if (transactionType === TransactionType.INCOME) {
		bucketAmountMap.set(bucketId, current + amount);
		return;
	}

	if (transactionType === TransactionType.EXPENSE) {
		bucketAmountMap.set(
			bucketId,
			isInvestment ? current + amount : current - amount,
		);
	}
}

function getNetBalanceByType(
	aggregations: Array<{
		type: TransactionType;
		_sum: { amount: unknown };
	}>,
) {
	let income = 0;
	let expense = 0;

	for (const aggregation of aggregations) {
		const amount = safeNumber(aggregation._sum.amount);

		if (aggregation.type === TransactionType.INCOME) {
			income = amount;
		} else if (aggregation.type === TransactionType.EXPENSE) {
			expense = amount;
		}
	}

	return income - expense;
}

export async function getWorkspaceSummary(
	db: PrismaClient,
	workspaceId: string,
): Promise<GetWorkspaceSummaryResult> {
	const globalAggregations = await db.transaction.groupBy({
		by: ["type"],
		where: buildGlobalSummaryWhere(workspaceId, {
			isPaid: true,
		}),
		_sum: { amount: true },
	});

	const currentBalance = getNetBalanceByType(globalAggregations);
	const totalBalance = currentBalance;

	const investmentBuckets = await db.bucket.findMany({
		where: { workspace_id: workspaceId, type: BucketType.INVESTMENT },
		select: { id: true },
	});

	let totalInvested = 0;
	if (investmentBuckets.length > 0) {
		const investmentBucketIds = investmentBuckets.map((bucket) => bucket.id);
		const investmentAgg = await db.transaction.aggregate({
			where: buildBucketBalanceWhere(workspaceId, {
				bucketIds: investmentBucketIds,
				isPaid: true,
			}),
			_sum: { amount: true },
		});
		totalInvested = safeNumber(investmentAgg._sum.amount);
	}

	const today = new Date();
	today.setHours(23, 59, 59, 999);

	const pendingAgg = await db.transaction.aggregate({
		where: buildGlobalSummaryWhere(workspaceId, {
			isPaid: false,
			maxDate: today,
		}),
		_sum: { amount: true },
	});
	const pendingBalance = safeNumber(pendingAgg._sum.amount);

	const allTransactions = await db.transaction.findMany({
		where: buildGlobalSummaryWhere(workspaceId, {
			isPaid: true,
			typeIn: [TransactionType.INCOME, TransactionType.EXPENSE],
		}),
		select: { type: true, amount: true, date: true },
		orderBy: { date: "asc" },
	});

	let running = 0;
	let maxBalance = 0;

	for (const transaction of allTransactions) {
		const amount = safeNumber(transaction.amount);

		if (transaction.type === TransactionType.INCOME) {
			running += amount;
		} else {
			running -= amount;
		}

		if (running > maxBalance) {
			maxBalance = running;
		}
	}

	const buckets = await db.bucket.findMany({
		where: { workspace_id: workspaceId },
		select: { id: true, name: true, type: true },
	});

	const directAggs = await db.transaction.groupBy({
		by: ["bucket_id", "type"],
		where: buildBucketBalanceWhere(workspaceId, {
			isPaid: true,
			requireBucket: true,
		}),
		_sum: { amount: true },
	});

	const splitRows = await db.transactionAllocation.findMany({
		where: {
			transaction: buildBucketBalanceWhere(workspaceId, {
				isPaid: true,
			}),
		},
		select: {
			bucket_id: true,
			amount: true,
			transaction: { select: { type: true } },
		},
	});

	const bucketTypeMap = new Map<string, BucketType>(
		buckets.map((bucket) => [bucket.id, bucket.type]),
	);
	const bucketAmountMap = new Map<string, number>();

	for (const aggregation of directAggs) {
		if (!aggregation.bucket_id) continue;

		applyBucketAmount(
			bucketAmountMap,
			bucketTypeMap,
			aggregation.bucket_id,
			aggregation.type,
			aggregation._sum.amount,
		);
	}

	for (const split of splitRows) {
		applyBucketAmount(
			bucketAmountMap,
			bucketTypeMap,
			split.bucket_id,
			split.transaction.type,
			split.amount,
		);
	}

	const totalDistributed = Array.from(bucketAmountMap.values()).reduce(
		(sum, value) => sum + Math.abs(value),
		0,
	);

	const distribution: BucketDistributionItem[] = buckets
		.map((bucket) => {
			const amount = bucketAmountMap.get(bucket.id) ?? 0;

			return {
				bucketId: bucket.id,
				bucketName: bucket.name,
				bucketType: bucket.type,
				amount,
				percentage:
					totalDistributed > 0
						? Math.round((Math.abs(amount) / totalDistributed) * 10000) / 100
						: 0,
			};
		})
		.filter((item) => item.amount !== 0);

	return {
		totalBalance,
		currentBalance,
		maxBalance,
		totalInvested,
		pendingBalance,
		distribution,
	};
}
