import { describe, expect, test } from 'bun:test';
import { TransactionType, type PrismaClient } from '@prisma/client';
import { getWorkspaceSummary } from './get-workspace-summary';

type GroupByTypeArgs = {
  by: ['type'];
  where: {
    workspace_id: string;
    is_paid: boolean;
    canceled_at: null;
    date?: unknown;
  };
  _sum: { amount: boolean };
};

type GroupByBucketDirectArgs = {
  by: ['bucket_id'];
  where: {
    workspace_id: string;
    is_paid: boolean;
    canceled_at: null;
    bucket_id: { not: null };
    date?: unknown;
  };
  _sum: { amount: boolean };
};

type GroupByArgs = GroupByTypeArgs | GroupByBucketDirectArgs;

type FindManyArgs = {
  where: {
    workspace_id: string;
    is_paid: boolean;
    canceled_at: null;
    type: { in: TransactionType[] };
    date?: unknown;
  };
  select: { type: boolean; amount: boolean; date: boolean };
  orderBy: { date: 'asc' };
};

type BucketFindManyArgs = {
  where: { workspace_id: string };
  select: { id: boolean; name: boolean; type: boolean };
};

type TransactionRow = {
  workspace_id: string;
  type: TransactionType;
  amount: number;
  is_paid: boolean;
  canceled_at: null;
  date: Date;
  bucket_id?: string | null;
};

type SplitRow = {
  bucket_id: string;
  amount: number;
  transaction: {
    workspace_id: string;
    is_paid: boolean;
    canceled_at: null;
    date: Date;
  };
};

type BucketRow = { id: string; name: string; type: string };

interface BuildDbOptions {
  transactions?: TransactionRow[];
  splits?: SplitRow[];
  buckets?: BucketRow[];
}

function buildDb(options: BuildDbOptions = {}) {
  const { transactions = [], splits = [], buckets = [] } = options;

  const db = {
    transaction: {
      groupBy: async (args: GroupByArgs) => {
        const isGroupByBucket = args.by[0] === 'bucket_id';

        const applyDateFilter = (txDate: Date, dateFilter?: unknown) => {
          if (!dateFilter) return true;
          const df = dateFilter as { gte?: Date; lte?: Date };
          if (df.gte && txDate < df.gte) return false;
          if (df.lte && txDate > df.lte) return false;
          return true;
        };

        if (isGroupByBucket) {
          const w = args.where as GroupByBucketDirectArgs['where'];
          const groups: Record<string, number> = {};
          for (const tx of transactions) {
            if (
              tx.workspace_id !== w.workspace_id ||
              tx.is_paid !== w.is_paid ||
              tx.canceled_at !== null ||
              !tx.bucket_id
            )
              continue;
            if (!applyDateFilter(tx.date, w.date)) continue;
            groups[tx.bucket_id] = (groups[tx.bucket_id] ?? 0) + tx.amount;
          }
          return Object.entries(groups).map(([bucket_id, amount]) => ({
            bucket_id,
            _sum: { amount },
          }));
        }

        // group by type
        const w = args.where as GroupByTypeArgs['where'];
        const groups: Record<string, number> = {};
        for (const tx of transactions) {
          if (
            tx.workspace_id !== w.workspace_id ||
            tx.is_paid !== w.is_paid ||
            tx.canceled_at !== null
          )
            continue;
          if (!applyDateFilter(tx.date, w.date)) continue;
          groups[tx.type] = (groups[tx.type] ?? 0) + tx.amount;
        }
        return Object.entries(groups).map(([type, amount]) => ({
          type: type as TransactionType,
          _sum: { amount },
        }));
      },

      findMany: async (args: FindManyArgs) => {
        const allowedTypes = args.where.type.in;
        const dateFilter = args.where.date as { gte?: Date; lte?: Date } | undefined;

        return transactions
          .filter((tx) => {
            if (
              tx.workspace_id !== args.where.workspace_id ||
              tx.is_paid !== args.where.is_paid ||
              tx.canceled_at !== null
            )
              return false;

            if (!allowedTypes.includes(tx.type)) return false;

            if (dateFilter) {
              if (dateFilter.gte && tx.date < dateFilter.gte) return false;
              if (dateFilter.lte && tx.date > dateFilter.lte) return false;
            }

            return true;
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((tx) => ({ type: tx.type, amount: tx.amount, date: tx.date }));
      },
    },

    bucket: {
      findMany: async (_args: BucketFindManyArgs) => buckets,
    },

    transactionSplit: {
      groupBy: async (args: GroupByBucketArgs) => {
        const where = args.where as {
          transaction: { workspace_id: string; is_paid: boolean; canceled_at: null; date?: unknown };
        };

        const groups: Record<string, number> = {};
        for (const split of splits) {
          if (
            split.transaction.workspace_id !== where.transaction.workspace_id ||
            split.transaction.is_paid !== where.transaction.is_paid ||
            split.transaction.canceled_at !== null
          )
            continue;

          if (where.transaction.date) {
            const dateFilter = where.transaction.date as {
              gte?: Date;
              lte?: Date;
            };
            if (dateFilter.gte && split.transaction.date < dateFilter.gte)
              continue;
            if (dateFilter.lte && split.transaction.date > dateFilter.lte)
              continue;
          }

          groups[split.bucket_id] =
            (groups[split.bucket_id] ?? 0) + split.amount;
        }

        return Object.entries(groups).map(([bucket_id, amount]) => ({
          bucket_id,
          _sum: { amount },
        }));
      },
    },
  } as unknown as PrismaClient;

  return db;
}

const WS = 'ws-1';
const BASE_DATE = new Date('2024-01-15T00:00:00Z');

function makeDate(offset: number) {
  return new Date(BASE_DATE.getTime() + offset * 24 * 60 * 60 * 1000);
}

describe('getWorkspaceSummary', () => {
  test('workspace vazio retorna tudo zerado e distribuição vazia', async () => {
    const db = buildDb();

    const result = await getWorkspaceSummary(db, WS);

    expect(result.currentBalance).toBe(0);
    expect(result.maxBalance).toBe(0);
    expect(result.totalInvested).toBe(0);
    expect(result.distribution).toEqual([]);
  });

  test('calcula currentBalance e totalInvested corretamente', async () => {
    const db = buildDb({
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 300,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.currentBalance).toBe(700); // 1000 - 300
    expect(result.totalInvested).toBe(1000); // apenas receitas
  });

  test('ignora transações não pagas (is_paid: false)', async () => {
    const db = buildDb({
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 500,
          is_paid: false,
          canceled_at: null,
          date: makeDate(0),
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.currentBalance).toBe(0);
    expect(result.totalInvested).toBe(0);
    expect(result.maxBalance).toBe(0);
  });

  test('calcula maxBalance como pico histórico do saldo corrente', async () => {
    const db = buildDb({
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 800,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
        },
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 200,
          is_paid: true,
          canceled_at: null,
          date: makeDate(2),
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.maxBalance).toBe(1000); // pico após o primeiro INCOME
    expect(result.currentBalance).toBe(400); // 1000 - 800 + 200
  });

  test('calcula distribution com transações diretas', async () => {
    const db = buildDb({
      buckets: [
        { id: 'b1', name: 'Lazer', type: 'SPENDING' },
        { id: 'b2', name: 'Emergência', type: 'RESERVE' },
      ],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 400,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'b1',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 100,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'b2',
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.distribution).toHaveLength(2);

    const lazer = result.distribution.find((d) => d.bucketId === 'b1');
    expect(lazer).toBeDefined();
    expect(lazer!.amount).toBe(400);
    expect(lazer!.percentage).toBe(80); // 400/500 = 80%

    const emergencia = result.distribution.find((d) => d.bucketId === 'b2');
    expect(emergencia!.amount).toBe(100);
    expect(emergencia!.percentage).toBe(20); // 100/500 = 20%
  });

  test('calcula distribution com transaction splits', async () => {
    const db = buildDb({
      buckets: [
        { id: 'b1', name: 'Lazer', type: 'SPENDING' },
        { id: 'b2', name: 'Educação', type: 'SPENDING' },
      ],
      splits: [
        {
          bucket_id: 'b1',
          amount: 300,
          transaction: {
            workspace_id: WS,
            is_paid: true,
            canceled_at: null,
            date: makeDate(0),
          },
        },
        {
          bucket_id: 'b2',
          amount: 200,
          transaction: {
            workspace_id: WS,
            is_paid: true,
            canceled_at: null,
            date: makeDate(0),
          },
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.distribution).toHaveLength(2);

    const lazer = result.distribution.find((d) => d.bucketId === 'b1');
    expect(lazer!.amount).toBe(300);
    expect(lazer!.percentage).toBe(60); // 300/500 = 60%

    const educacao = result.distribution.find((d) => d.bucketId === 'b2');
    expect(educacao!.amount).toBe(200);
    expect(educacao!.percentage).toBe(40); // 200/500 = 40%
  });

  test('combina transações diretas e splits no mesmo bucket', async () => {
    const db = buildDb({
      buckets: [{ id: 'b1', name: 'Lazer', type: 'SPENDING' }],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 200,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'b1',
        },
      ],
      splits: [
        {
          bucket_id: 'b1',
          amount: 150,
          transaction: {
            workspace_id: WS,
            is_paid: true,
            canceled_at: null,
            date: makeDate(0),
          },
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.distribution).toHaveLength(1);
    expect(result.distribution[0].amount).toBe(350); // 200 + 150
    expect(result.distribution[0].percentage).toBe(100);
  });

  test('omite buckets sem movimentação (amount = 0)', async () => {
    const db = buildDb({
      buckets: [
        { id: 'b1', name: 'Ativo', type: 'SPENDING' },
        { id: 'b2', name: 'Inativo', type: 'SPENDING' },
      ],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 500,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'b1',
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.distribution).toHaveLength(1);
    expect(result.distribution[0].bucketId).toBe('b1');
  });

  test('retorna percentuais zerados quando totalDistributed é 0', async () => {
    const db = buildDb({
      buckets: [{ id: 'b1', name: 'Lazer', type: 'SPENDING' }],
    });

    const result = await getWorkspaceSummary(db, WS);

    // Nenhuma transação → nenhum bucket com amount > 0 → distribution vazia
    expect(result.distribution).toEqual([]);
  });

  test('aplica filtro de startDate e endDate', async () => {
    const inRange = makeDate(5);
    const outOfRange = makeDate(20);

    const db = buildDb({
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: inRange,
        },
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 9999,
          is_paid: true,
          canceled_at: null,
          date: outOfRange,
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS, {
      startDate: makeDate(0),
      endDate: makeDate(10),
    });

    expect(result.currentBalance).toBe(1000); // apenas a transação dentro do intervalo
    expect(result.totalInvested).toBe(1000);
  });
});
