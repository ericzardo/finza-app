import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { distributeInboxBalance } from './distribute-inbox-balance';

interface BuildDbOptions {
  inboxBucketId?: string | null;
  inboxTransactions?: Array<{ type: string; amount: number }>;
  buckets?: Array<{ id: string; type: 'SPENDING' | 'INVESTMENT' | 'INBOX' }>;
}

function buildDb(opts: BuildDbOptions = {}) {
  const {
    inboxBucketId = 'inbox-id',
    inboxTransactions = [{ type: 'INCOME', amount: 500 }],
    buckets = [{ id: 'dest-bucket', type: 'SPENDING' }],
  } = opts;

  const createManyCalls: Array<{ data: Array<Record<string, unknown>> }> = [];

  const txProxy = {
    bucket: {
      findFirst: async () => (inboxBucketId ? { id: inboxBucketId } : null),
      findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
        buckets.filter((bucket) => where.id.in.includes(bucket.id)),
    },
    transaction: {
      groupBy: async () => {
        const grouped = new Map<string, number>();

        for (const transaction of inboxTransactions) {
          grouped.set(
            transaction.type,
            (grouped.get(transaction.type) ?? 0) + transaction.amount,
          );
        }

        return Array.from(grouped.entries()).map(([type, amount]) => ({
          type,
          _sum: { amount },
        }));
      },
      findMany: async () =>
        inboxTransactions.map((transaction) => ({
          type: transaction.type,
          amount: {
            toNumber: () => transaction.amount,
            valueOf: () => transaction.amount,
          },
        })),
      createMany: async (args: { data: Array<Record<string, unknown>> }) => {
        createManyCalls.push(args);
        return { count: args.data.length };
      },
    },
  };

  const db = {
    $transaction: async (fn: (tx: typeof txProxy) => Promise<unknown>) =>
      fn(txProxy),
  } as unknown as PrismaClient;

  return { db, createManyCalls };
}

describe('distributeInboxBalance', () => {
  test('cria partidas dobradas para cada destino sem usar allocations', async () => {
    const { db, createManyCalls } = buildDb({
      inboxTransactions: [{ type: 'INCOME', amount: 500 }],
      buckets: [
        { id: 'bucket-a', type: 'SPENDING' },
        { id: 'bucket-b', type: 'INVESTMENT' },
      ],
    });

    const result = await distributeInboxBalance(db, {
      workspaceId: 'ws-id',
      distributions: [
        { bucket_id: 'bucket-a', amount: 150 },
        { bucket_id: 'bucket-b', amount: 50 },
      ],
    });

    expect(result.distributions).toHaveLength(2);
    expect(result.available).toBe(300);
    expect(createManyCalls).toHaveLength(1);
    expect(createManyCalls[0].data).toHaveLength(4);
  });

  test('lança BAD_REQUEST quando a soma ultrapassa o saldo real do inbox', async () => {
    const { db } = buildDb({
      inboxTransactions: [{ type: 'INCOME', amount: 100 }],
    });

    await expect(
      distributeInboxBalance(db, {
        workspaceId: 'ws-id',
        distributions: [{ bucket_id: 'dest-bucket', amount: 150 }],
      }),
    ).rejects.toThrow('Saldo insuficiente no INBOX');
  });

  test('lança NOT_FOUND quando um bucket destino não existe', async () => {
    const { db } = buildDb({ buckets: [] });

    await expect(
      distributeInboxBalance(db, {
        workspaceId: 'ws-id',
        distributions: [{ bucket_id: 'missing-bucket', amount: 50 }],
      }),
    ).rejects.toThrow('Caixa de propósito não encontrado');
  });

  test('lança BAD_REQUEST quando o inbox é usado como destino', async () => {
    const { db } = buildDb({
      buckets: [{ id: 'inbox-id', type: 'INBOX' }],
    });

    await expect(
      distributeInboxBalance(db, {
        workspaceId: 'ws-id',
        distributions: [{ bucket_id: 'inbox-id', amount: 50 }],
      }),
    ).rejects.toThrow(
      'O Caixa de Entrada (INBOX) não pode ser usado como destino da distribuição',
    );
  });
});
