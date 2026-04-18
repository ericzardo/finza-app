import { InternalType, type PrismaClient } from '@prisma/client';
import type {
  BucketWithAggregates,
  InboxBucketItem,
  InvestmentBucketItem,
  SpendingBucketItem,
} from './create-bucket';
import { serializeBucket } from './create-bucket';

interface ListBucketsInput {
  workspaceId: string;
  startDate?: string;
  endDate?: string;
}

/**
 * TODO [Card Futuro]: Regra de Cascata para Caixa de Entrada
 *
 * Se uma DESPESA é registrada em um bucket sem saldo suficiente,
 * o valor deve sair do Caixa de Entrada automaticamente.
 *
 * Recomendação: resolver no write-time (criação/edição da transação),
 * não no read-time. O service deve verificar o saldo do bucket-alvo
 * e, se insuficiente, criar uma transação espelho de saída no Inbox.
 * Isso mantém a fonte da verdade limpa e o cálculo On-Fly simples.
 */

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
    orderBy: { created_at: 'asc' },
  });

  const spendingIds = buckets
    .filter((b) => b.type === 'SPENDING')
    .map((b) => b.id);
  const investmentIds = buckets
    .filter((b) => b.type === 'INVESTMENT')
    .map((b) => b.id);
  const inboxIds = buckets.filter((b) => b.type === 'INBOX').map((b) => b.id);

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
          by: ['bucket_id', 'type'],
          where: {
            bucket_id: { in: spendingIds },
            ...buildBalanceWhere(),
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),

    // SPENDING: agregação do período
    spendingIds.length > 0 && dateFilter
      ? db.transaction.groupBy({
          by: ['bucket_id', 'type'],
          where: {
            bucket_id: { in: spendingIds },
            ...buildBucketPerformanceWhere(dateFilter),
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),

    // INVESTMENT: agregação histórica
    investmentIds.length > 0
      ? db.transaction.groupBy({
          by: ['bucket_id', 'type'],
          where: {
            bucket_id: { in: investmentIds },
            ...buildBalanceWhere(),
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),

    // INVESTMENT: agregação do período
    investmentIds.length > 0 && dateFilter
      ? db.transaction.groupBy({
          by: ['bucket_id', 'type'],
          where: {
            bucket_id: { in: investmentIds },
            ...buildBucketPerformanceWhere(dateFilter),
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),

    // Receita total do workspace no período (base para period_target)
      dateFilter
      ? db.transaction.aggregate({
          where: buildWorkspaceRevenueWhere(workspaceId, dateFilter),
          _sum: { amount: true },
        })
      : Promise.resolve(null),

    // INBOX: agregação histórica (net = income - expense)
    // Inclui transações internas para refletir a cascata de saldo
    inboxIds.length > 0
      ? db.transaction.groupBy({
          by: ['bucket_id', 'type'],
          where: {
            bucket_id: { in: inboxIds },
            ...buildBalanceWhere(),
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),

    // INBOX: agregação do período
    // Inclui transações internas para refletir a cascata de saldo
    inboxIds.length > 0 && dateFilter
      ? db.transaction.groupBy({
          by: ['bucket_id', 'type'],
          where: {
            bucket_id: { in: inboxIds },
            ...buildBalanceWhere(dateFilter),
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
  ]);

  const workspaceIncomeInPeriod = workspacePeriodIncome
    ? toNumber(workspacePeriodIncome._sum.amount)
    : 0;

  return buckets.map((bucket): BucketWithAggregates => {
    const base = serializeBucket(bucket);

    if (bucket.type === 'INBOX') {
      type AggRow = {
        bucket_id: string | null;
        type: string;
        _sum: { amount: { toNumber(): number } | number | null };
      };

      const historicalRows = (inboxHistoricalAgg as AggRow[]).filter(
        (r) => r.bucket_id === bucket.id,
      );
      const historicalIncome = toNumber(
        historicalRows.find((r) => r.type === 'INCOME')?._sum.amount,
      );
      const historicalExpense = toNumber(
        historicalRows.find((r) => r.type === 'EXPENSE')?._sum.amount,
      );

      const periodRows = (inboxPeriodAgg as AggRow[]).filter(
        (r) => r.bucket_id === bucket.id,
      );
      const periodIncome = toNumber(
        periodRows.find((r) => r.type === 'INCOME')?._sum.amount,
      );
      const periodExpense = toNumber(
        periodRows.find((r) => r.type === 'EXPENSE')?._sum.amount,
      );

      return {
        ...base,
        type: 'INBOX',
        current_amount: round(historicalIncome - historicalExpense),
        period_income: round(periodIncome),
        period_spent: round(periodExpense),
      } satisfies InboxBucketItem;
    }

    if (bucket.type === 'SPENDING') {
      const historicalRows = (
        spendingHistoricalAgg as Array<{
          bucket_id: string | null;
          type: string;
          _sum: { amount: { toNumber(): number } | number | null };
        }>
      ).filter((r) => r.bucket_id === bucket.id);

      const historicalIncome = toNumber(
        historicalRows.find((r) => r.type === 'INCOME')?._sum.amount,
      );
      const historicalExpense = toNumber(
        historicalRows.find((r) => r.type === 'EXPENSE')?._sum.amount,
      );

      const periodRows = (
        spendingPeriodAgg as Array<{
          bucket_id: string | null;
          type: string;
          _sum: { amount: { toNumber(): number } | number | null };
        }>
      ).filter((r) => r.bucket_id === bucket.id);

      const periodIncome = toNumber(
        periodRows.find((r) => r.type === 'INCOME')?._sum.amount,
      );
      const periodExpense = toNumber(
        periodRows.find((r) => r.type === 'EXPENSE')?._sum.amount,
      );

      return {
        ...base,
        type: 'SPENDING',
        current_amount: round(historicalIncome - historicalExpense),
        period_allocated: round(periodIncome),
        period_spent: round(periodExpense),
      } satisfies SpendingBucketItem;
    }

    // INVESTMENT
    const historicalRows = (
      investmentHistoricalAgg as Array<{
        bucket_id: string | null;
        type: string;
        _sum: { amount: { toNumber(): number } | number | null };
      }>
    ).filter((r) => r.bucket_id === bucket.id);
    const periodRows = (
      investmentPeriodAgg as Array<{
        bucket_id: string | null;
        type: string;
        _sum: { amount: { toNumber(): number } | number | null };
      }>
    ).filter((r) => r.bucket_id === bucket.id);

    const historicalTotal = historicalRows.reduce(
      (sum, row) => sum + toNumber(row._sum.amount),
      0,
    );
    const periodInvested = periodRows.reduce(
      (sum, row) => sum + toNumber(row._sum.amount),
      0,
    );

    const allocationPct = base.allocation_percentage / 100;
    const periodTarget = round(workspaceIncomeInPeriod * allocationPct);

    return {
      ...base,
      type: 'INVESTMENT',
      current_amount: round(historicalTotal),
      current_invested: round(historicalTotal),
      period_target: periodTarget,
      period_invested: round(periodInvested),
    } satisfies InvestmentBucketItem;
  });
}

function buildBalanceWhere(date?: { gte?: Date; lte?: Date }) {
  return {
    is_paid: true,
    canceled_at: null,
    ...(date ? { date } : {}),
  };
}

function buildBucketPerformanceWhere(date?: { gte?: Date; lte?: Date }) {
  return {
    is_paid: true,
    canceled_at: null,
    OR: [
      { internal_type: null as null },
      { internal_type: InternalType.DISTRIBUTION },
    ],
    ...(date ? { date } : {}),
  };
}

function buildWorkspaceRevenueWhere(
  workspaceId: string,
  date?: { gte?: Date; lte?: Date },
) {
  return {
    workspace_id: workspaceId,
    type: 'INCOME' as const,
    is_paid: true,
    internal_type: null as null,
    canceled_at: null,
    ...(date ? { date } : {}),
  };
}

function toNumber(
  val: { toNumber(): number } | number | null | undefined,
): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  return val.toNumber();
}

function round(val: number): number {
  return Math.round(val * 100) / 100;
}
