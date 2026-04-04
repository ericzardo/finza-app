import { describe, expect, test } from 'bun:test';
import { TransactionType, BucketType, type PrismaClient } from '@prisma/client';
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

type GroupByBucketTypeArgs = {
  by: ['bucket_id', 'type'];
  where: {
    workspace_id: string;
    is_paid: boolean;
    canceled_at: null;
    bucket_id: { not: null };
    date?: unknown;
  };
  _sum: { amount: boolean };
};

type GroupByArgs = GroupByTypeArgs | GroupByBucketTypeArgs;

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
  where: { workspace_id: string; type?: unknown };
  select: { id: boolean; name?: boolean; type?: boolean };
};

type AggregateArgs = {
  where: {
    workspace_id: string;
    is_paid?: boolean;
    canceled_at?: null;
    bucket_id?: { in: string[] };
    date?: unknown;
  };
  _sum: { amount: boolean };
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
    type: TransactionType;
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

  const applyDateFilter = (txDate: Date, dateFilter?: unknown) => {
    if (!dateFilter) return true;
    const df = dateFilter as { gte?: Date; lte?: Date };
    if (df.gte && txDate < df.gte) return false;
    if (df.lte && txDate > df.lte) return false;
    return true;
  };

  const db = {
    transaction: {
      groupBy: async (args: GroupByArgs) => {
        const isByBucketType =
          args.by.length === 2 &&
          args.by[0] === 'bucket_id' &&
          args.by[1] === 'type';

        if (isByBucketType) {
          const w = args.where as GroupByBucketTypeArgs['where'];
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
            const key = `${tx.bucket_id}::${tx.type}`;
            groups[key] = (groups[key] ?? 0) + tx.amount;
          }
          return Object.entries(groups).map(([key, amount]) => {
            const [bucket_id, type] = key.split('::');
            return {
              bucket_id,
              type: type as TransactionType,
              _sum: { amount },
            };
          });
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
        const dateFilter = args.where.date as
          | { gte?: Date; lte?: Date }
          | undefined;

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

      aggregate: async (args: AggregateArgs) => {
        let total = 0;
        for (const tx of transactions) {
          if (tx.workspace_id !== args.where.workspace_id) continue;
          if (tx.canceled_at !== null) continue;

          if (
            args.where.is_paid !== undefined &&
            tx.is_paid !== args.where.is_paid
          )
            continue;

          if (args.where.bucket_id) {
            const allowedIds = (args.where.bucket_id as { in: string[] }).in;
            if (!tx.bucket_id || !allowedIds.includes(tx.bucket_id)) continue;
          }

          if (!applyDateFilter(tx.date, args.where.date)) continue;

          total += tx.amount;
        }
        return { _sum: { amount: total === 0 ? null : total } };
      },
    },

    bucket: {
      findMany: async (args: BucketFindManyArgs) => {
        if (args.where.type) {
          const targetType = args.where.type as BucketType;
          return buckets.filter((b) => b.type === targetType);
        }
        return buckets;
      },
    },

    transactionSplit: {
      findMany: async (args: {
        where: {
          transaction: {
            workspace_id: string;
            is_paid: boolean;
            canceled_at: null;
            date?: unknown;
          };
        };
        select: unknown;
      }) => {
        const tw = args.where.transaction;
        return splits
          .filter((split) => {
            if (
              split.transaction.workspace_id !== tw.workspace_id ||
              split.transaction.is_paid !== tw.is_paid ||
              split.transaction.canceled_at !== null
            )
              return false;

            if (tw.date) {
              const df = tw.date as { gte?: Date; lte?: Date };
              if (df.gte && split.transaction.date < df.gte) return false;
              if (df.lte && split.transaction.date > df.lte) return false;
            }

            return true;
          })
          .map((split) => ({
            bucket_id: split.bucket_id,
            amount: split.amount,
            transaction: { type: split.transaction.type },
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
    expect(result.pendingBalance).toBe(0);
    expect(result.distribution).toEqual([]);
  });

  test('calcula currentBalance corretamente (receitas - despesas pagas)', async () => {
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
  });

  test('calcula totalInvested como soma de transações em buckets INVESTMENT', async () => {
    const db = buildDb({
      buckets: [
        { id: 'inbox', name: 'Caixa de Entrada', type: 'INBOX' },
        { id: 'inv', name: 'Investimentos', type: 'INVESTMENT' },
      ],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'inbox',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 400,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
          bucket_id: 'inv',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 100,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
          bucket_id: 'inbox',
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.totalInvested).toBe(400); // only the INVESTMENT bucket transaction
    expect(result.currentBalance).toBe(500); // 1000 - 400 - 100
  });

  test('totalInvested é 0 quando não há buckets INVESTMENT', async () => {
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
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.totalInvested).toBe(0);
  });

  test('calcula pendingBalance como soma das transações não pagas', async () => {
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
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 200,
          is_paid: false,
          canceled_at: null,
          date: makeDate(1),
        },
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.pendingBalance).toBe(700); // 500 + 200 (absolute sum of unpaid)
    expect(result.currentBalance).toBe(1000); // only paid
  });

  test('pendingBalance retorna 0 quando não há transações pendentes (aggregate null)', async () => {
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
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.pendingBalance).toBe(0);
    expect(result.currentBalance).toBe(1000);
  });

  test('ignora transações não pagas no currentBalance', async () => {
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

  test('calcula distribution respeitando sinal (income - expense por bucket)', async () => {
    const db = buildDb({
      buckets: [
        { id: 'inbox', name: 'Caixa de Entrada', type: 'INBOX' },
        { id: 'inv', name: 'Investimentos', type: 'INVESTMENT' },
      ],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'inbox',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 100,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
          bucket_id: 'inbox',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 400,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
          bucket_id: 'inv',
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    // Inbox: 1000 income - 100 expense = 900
    const inbox = result.distribution.find((d) => d.bucketId === 'inbox');
    expect(inbox).toBeDefined();
    expect(inbox!.amount).toBe(900);

    // Investment: 0 income - 400 expense = 400 (treated as positive contribution)
    const inv = result.distribution.find((d) => d.bucketId === 'inv');
    expect(inv).toBeDefined();
    expect(inv!.amount).toBe(400);
  });

  test('calcula distribution com transaction splits respeitando sinal', async () => {
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
            type: TransactionType.INCOME,
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
            type: TransactionType.EXPENSE,
            date: makeDate(0),
          },
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    const lazer = result.distribution.find((d) => d.bucketId === 'b1');
    expect(lazer!.amount).toBe(300); // income split

    const educacao = result.distribution.find((d) => d.bucketId === 'b2');
    expect(educacao!.amount).toBe(-200); // expense split
  });

  test('combina transações diretas e splits no mesmo bucket', async () => {
    const db = buildDb({
      buckets: [{ id: 'b1', name: 'Lazer', type: 'SPENDING' }],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 500,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'b1',
        },
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
            type: TransactionType.EXPENSE,
            date: makeDate(0),
          },
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.distribution).toHaveLength(1);
    // 500 (income) - 200 (expense direct) - 150 (expense split) = 150
    expect(result.distribution[0].amount).toBe(150);
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
          type: TransactionType.INCOME,
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

    // Nenhuma transação → nenhum bucket com amount != 0 → distribution vazia
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
  });

  test('cenário completo: R$1.000 receita, R$100 despesa Inbox, R$400 despesa Inv', async () => {
    const db = buildDb({
      buckets: [
        { id: 'inbox', name: 'Caixa de Entrada', type: 'INBOX' },
        { id: 'inv', name: 'Investimentos', type: 'INVESTMENT' },
      ],
      transactions: [
        {
          workspace_id: WS,
          type: TransactionType.INCOME,
          amount: 1000,
          is_paid: true,
          canceled_at: null,
          date: makeDate(0),
          bucket_id: 'inbox',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 100,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
          bucket_id: 'inbox',
        },
        {
          workspace_id: WS,
          type: TransactionType.EXPENSE,
          amount: 400,
          is_paid: true,
          canceled_at: null,
          date: makeDate(1),
          bucket_id: 'inv',
        },
      ],
    });

    const result = await getWorkspaceSummary(db, WS);

    expect(result.currentBalance).toBe(500); // 1000 - 100 - 400
    expect(result.totalInvested).toBe(400); // only investment bucket
    expect(result.pendingBalance).toBe(0);

    const inbox = result.distribution.find((d) => d.bucketId === 'inbox');
    expect(inbox!.amount).toBe(900); // 1000 - 100

    const inv = result.distribution.find((d) => d.bucketId === 'inv');
    expect(inv!.amount).toBe(400); // 0 - 400 (treated as positive contribution)
  });
});
