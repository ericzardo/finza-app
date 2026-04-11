import type { PrismaClient } from '@prisma/client';

interface ListInternalTransactionsInput {
  workspaceId: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export interface InternalTransactionPair {
  transfer_pair_id: string;
  date: string;
  amount: number;
  from_bucket_name: string;
  to_bucket_name: string;
  reason: 'CASCADE_INSUFFICIENT_BALANCE';
}

interface ListInternalTransactionsResult {
  data: InternalTransactionPair[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function listInternalTransactions(
  db: PrismaClient,
  input: ListInternalTransactionsInput,
): Promise<ListInternalTransactionsResult> {
  const { workspaceId, startDate, endDate, page, limit } = input;

  const dateFilter =
    startDate || endDate
      ? {
          date: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {};

  const baseWhere = {
    workspace_id: workspaceId,
    internal_type: { not: null },
    transfer_pair_id: { not: null },
    ...dateFilter,
  };

  const distinctPairs = await db.transaction.findMany({
    where: baseWhere,
    distinct: ['transfer_pair_id'],
    select: { transfer_pair_id: true },
    orderBy: { date: 'desc' },
  });

  const total = distinctPairs.length;

  const pagedPairIds = distinctPairs
    .slice((page - 1) * limit, page * limit)
    .map((r) => r.transfer_pair_id)
    .filter((id): id is string => id !== null);

  if (pagedPairIds.length === 0) {
    return { data: [], meta: { total, page, limit } };
  }

  const transactions = await db.transaction.findMany({
    where: {
      transfer_pair_id: { in: pagedPairIds },
    },
    include: {
      bucket: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });

  const grouped = new Map<string, (typeof transactions)[number][]>();
  for (const t of transactions) {
    if (!t.transfer_pair_id) continue;
    const group = grouped.get(t.transfer_pair_id);
    if (group) {
      group.push(t);
    } else {
      grouped.set(t.transfer_pair_id, [t]);
    }
  }

  const data: InternalTransactionPair[] = [];

  for (const pairId of pagedPairIds) {
    const pair = grouped.get(pairId);
    if (!pair || pair.length !== 2) continue;

    const expense = pair.find((t) => t.type === 'EXPENSE');
    const income = pair.find((t) => t.type === 'INCOME');
    if (!expense || !income) continue;

    data.push({
      transfer_pair_id: pairId,
      date: (income.date ?? expense.date).toISOString(),
      amount: Number(income.amount),
      from_bucket_name: expense.bucket?.name ?? 'Desconhecido',
      to_bucket_name: income.bucket?.name ?? 'Desconhecido',
      reason: 'CASCADE_INSUFFICIENT_BALANCE',
    });
  }

  return { data, meta: { total, page, limit } };
}
