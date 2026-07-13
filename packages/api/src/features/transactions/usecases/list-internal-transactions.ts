import type { PrismaClient, InternalType } from '@prisma/client';

interface ListInternalTransactionsInput {
  workspaceId: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export interface InternalTransactionEntry {
  id: string;
  internal_type: InternalType;
  date: string;
  amount: number;
  description: string | null;
  transfer_pair_id: string | null;
  from_bucket_name: string | null;
  to_bucket_name: string | null;
}

interface ListInternalTransactionsResult {
  data: InternalTransactionEntry[];
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
    internal_type: { not: null } as { not: null },
    ...dateFilter,
  };

  // Paired internal transactions (CASCADE, DISTRIBUTION)
  const pairedWhere = {
    ...baseWhere,
    transfer_pair_id: { not: null } as { not: null },
  };

  const distinctPairs = await db.transaction.findMany({
    where: pairedWhere,
    distinct: ['transfer_pair_id'],
    select: { transfer_pair_id: true, date: true },
    orderBy: { date: 'desc' },
  });

  // Solo internal transactions (BALANCE_ADJUSTMENT — no transfer_pair_id)
  const soloWhere = {
    ...baseWhere,
    transfer_pair_id: null,
  };

  const soloTransactions = await db.transaction.findMany({
    where: soloWhere,
    include: {
      bucket: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Merge both into a unified timeline sorted by date desc
  type TimelineItem =
    | { kind: 'pair'; pairId: string; date: Date }
    | { kind: 'solo'; transaction: (typeof soloTransactions)[number] };

  const timeline: TimelineItem[] = [
    ...distinctPairs
      .filter((r) => r.transfer_pair_id !== null)
      .map((r) => ({
        kind: 'pair' as const,
        pairId: r.transfer_pair_id!,
        date: r.date,
      })),
    ...soloTransactions.map((t) => ({
      kind: 'solo' as const,
      transaction: t,
    })),
  ];

  timeline.sort((a, b) => {
    const dateA = a.kind === 'pair' ? a.date : a.transaction.date;
    const dateB = b.kind === 'pair' ? b.date : b.transaction.date;
    return dateB.getTime() - dateA.getTime();
  });

  const total = timeline.length;

  const pagedItems = timeline.slice((page - 1) * limit, page * limit);

  if (pagedItems.length === 0) {
    return { data: [], meta: { total, page, limit } };
  }

  // Fetch full pair data for paged pairs
  const pagedPairIds = pagedItems
    .filter(
      (item): item is Extract<TimelineItem, { kind: 'pair' }> =>
        item.kind === 'pair',
    )
    .map((item) => item.pairId);

  let pairTransactions: typeof soloTransactions = [];
  if (pagedPairIds.length > 0) {
    pairTransactions = await db.transaction.findMany({
      where: {
        transfer_pair_id: { in: pagedPairIds },
      },
      include: {
        bucket: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  const grouped = new Map<string, (typeof pairTransactions)[number][]>();
  for (const t of pairTransactions) {
    if (!t.transfer_pair_id) continue;
    const group = grouped.get(t.transfer_pair_id);
    if (group) {
      group.push(t);
    } else {
      grouped.set(t.transfer_pair_id, [t]);
    }
  }

  // Build result in timeline order
  const data: InternalTransactionEntry[] = [];

  for (const item of pagedItems) {
    if (item.kind === 'pair') {
      const pair = grouped.get(item.pairId);
      if (!pair || pair.length !== 2) continue;

      const expense = pair.find((t) => t.type === 'EXPENSE');
      const income = pair.find((t) => t.type === 'INCOME');
      if (!expense || !income) continue;

      data.push({
        id: item.pairId,
        internal_type: income.internal_type!,
        date: (income.date ?? expense.date).toISOString(),
        amount: Number(income.amount),
        description: income.description,
        transfer_pair_id: item.pairId,
        from_bucket_name: expense.bucket?.name ?? null,
        to_bucket_name: income.bucket?.name ?? null,
      });
    } else {
      const t = item.transaction;
      data.push({
        id: t.id,
        internal_type: t.internal_type!,
        date: t.date.toISOString(),
        amount: Number(t.amount),
        description: t.description,
        transfer_pair_id: null,
        from_bucket_name: null,
        to_bucket_name: t.bucket?.name ?? null,
      });
    }
  }

  return { data, meta: { total, page, limit } };
}
