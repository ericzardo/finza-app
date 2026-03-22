import { type PrismaClient, TransactionType } from '@prisma/client';

export interface BucketDistributionItem {
  bucketId: string;
  bucketName: string;
  bucketType: string;
  amount: number;
  percentage: number;
}

export interface GetWorkspaceSummaryResult {
  currentBalance: number;
  maxBalance: number;
  totalInvested: number;
  distribution: BucketDistributionItem[];
}

interface GetWorkspaceSummaryOptions {
  startDate?: Date;
  endDate?: Date;
}

export async function getWorkspaceSummary(
  db: PrismaClient,
  workspaceId: string,
  options: GetWorkspaceSummaryOptions = {},
): Promise<GetWorkspaceSummaryResult> {
  const dateFilter =
    options.startDate || options.endDate
      ? {
          date: {
            ...(options.startDate ? { gte: options.startDate } : {}),
            ...(options.endDate ? { lte: options.endDate } : {}),
          },
        }
      : {};

  // currentBalance & totalInvested — aggregate by type
  const aggregations = await db.transaction.groupBy({
    by: ['type'],
    where: {
      workspace_id: workspaceId,
      is_paid: true,
      canceled_at: null,
      ...dateFilter,
    },
    _sum: { amount: true },
  });

  let income = 0;
  let expense = 0;

  for (const agg of aggregations) {
    const amount = Number(agg._sum.amount ?? 0);
    if (agg.type === TransactionType.INCOME) income = amount;
    else if (agg.type === TransactionType.EXPENSE) expense = amount;
  }

  const currentBalance = income - expense;
  const totalInvested = income;

  // maxBalance — compute running balance over all paid transactions sorted by date
  const allTransactions = await db.transaction.findMany({
    where: {
      workspace_id: workspaceId,
      is_paid: true,
      canceled_at: null,
      type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      ...dateFilter,
    },
    select: { type: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  let running = 0;
  let maxBalance = 0;

  for (const tx of allTransactions) {
    const amount = Number(tx.amount);
    if (tx.type === TransactionType.INCOME) running += amount;
    else running -= amount;
    if (running > maxBalance) maxBalance = running;
  }

  // distribution — per bucket (direct transactions + splits)
  const buckets = await db.bucket.findMany({
    where: { workspace_id: workspaceId },
    select: { id: true, name: true, type: true },
  });

  // Direct transactions assigned to a bucket
  const directAggs = await db.transaction.groupBy({
    by: ['bucket_id'],
    where: {
      workspace_id: workspaceId,
      is_paid: true,
      canceled_at: null,
      bucket_id: { not: null },
      ...dateFilter,
    },
    _sum: { amount: true },
  });

  // TransactionSplits assigned to a bucket
  const splitAggs = await db.transactionSplit.groupBy({
    by: ['bucket_id'],
    where: {
      transaction: {
        workspace_id: workspaceId,
        is_paid: true,
        canceled_at: null,
        ...dateFilter,
      },
    },
    _sum: { amount: true },
  });

  const bucketAmountMap = new Map<string, number>();

  for (const agg of directAggs) {
    if (!agg.bucket_id) continue;
    const current = bucketAmountMap.get(agg.bucket_id) ?? 0;
    bucketAmountMap.set(agg.bucket_id, current + Number(agg._sum.amount ?? 0));
  }

  for (const agg of splitAggs) {
    const current = bucketAmountMap.get(agg.bucket_id) ?? 0;
    bucketAmountMap.set(agg.bucket_id, current + Number(agg._sum.amount ?? 0));
  }

  const totalDistributed = Array.from(bucketAmountMap.values()).reduce(
    (sum, v) => sum + v,
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
            ? Math.round((amount / totalDistributed) * 10000) / 100
            : 0,
      };
    })
    .filter((item) => item.amount > 0);

  return { currentBalance, maxBalance, totalInvested, distribution };
}
