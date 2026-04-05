import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { listInternalTransactions } from './list-internal-transactions';

const now = new Date('2026-01-15T10:00:00.000Z');
const yesterday = new Date('2026-01-14T10:00:00.000Z');
const twoDaysAgo = new Date('2026-01-13T10:00:00.000Z');

function makeMockInternalPair(
  transferPairId: string,
  opts: {
    date?: Date;
    amount?: number;
    fromBucketName?: string;
    toBucketName?: string;
  } = {},
) {
  const date = opts.date ?? now;
  const amount = opts.amount ?? 100;
  const fromBucket = opts.fromBucketName ?? 'Caixa de Entrada';
  const toBucket = opts.toBucketName ?? 'Investimentos';

  return [
    {
      id: `${transferPairId}-expense`,
      workspace_id: 'ws-id',
      type: 'EXPENSE' as const,
      amount: {
        toNumber: () => amount,
        valueOf: () => amount,
      } as unknown as number,
      description: 'Cascata',
      date,
      is_paid: true,
      is_internal: true,
      transfer_pair_id: transferPairId,
      bucket_id: 'inbox-id',
      bucket: { name: fromBucket },
      source_transaction_id: 'source-txn',
      created_at: date,
      updated_at: date,
    },
    {
      id: `${transferPairId}-income`,
      workspace_id: 'ws-id',
      type: 'INCOME' as const,
      amount: {
        toNumber: () => amount,
        valueOf: () => amount,
      } as unknown as number,
      description: 'Cascata',
      date,
      is_paid: true,
      is_internal: true,
      transfer_pair_id: transferPairId,
      bucket_id: 'invest-id',
      bucket: { name: toBucket },
      source_transaction_id: 'source-txn',
      created_at: date,
      updated_at: date,
    },
  ];
}

interface BuildDbOptions {
  pairs?: ReturnType<typeof makeMockInternalPair>[];
}

function buildDb(opts: BuildDbOptions = {}) {
  const { pairs = [] } = opts;
  const allTransactions = pairs.flat();

  return {
    transaction: {
      findMany: async (args: {
        where?: Record<string, unknown>;
        distinct?: string[];
        select?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
      }) => {
        if (args.distinct) {
          const seen = new Set<string>();
          return allTransactions
            .filter((t) => {
              if (!t.transfer_pair_id || seen.has(t.transfer_pair_id))
                return false;
              seen.add(t.transfer_pair_id);
              return true;
            })
            .map((t) => ({ transfer_pair_id: t.transfer_pair_id }));
        }

        if (args.where && 'transfer_pair_id' in args.where) {
          const filter = args.where.transfer_pair_id as { in: string[] };
          return allTransactions.filter(
            (t) =>
              t.transfer_pair_id !== null &&
              filter.in.includes(t.transfer_pair_id),
          );
        }

        return allTransactions;
      },
    },
  } as unknown as PrismaClient;
}

describe('listInternalTransactions', () => {
  test('retorna lista vazia quando não há transações internas', async () => {
    const db = buildDb({ pairs: [] });
    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  test('agrupa pares corretamente com from/to bucket names', async () => {
    const pair = makeMockInternalPair('pair-1', {
      fromBucketName: 'Caixa de Entrada',
      toBucketName: 'Investimentos',
      amount: 250,
    });
    const db = buildDb({ pairs: [pair] });

    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].transfer_pair_id).toBe('pair-1');
    expect(result.data[0].amount).toBe(250);
    expect(result.data[0].from_bucket_name).toBe('Caixa de Entrada');
    expect(result.data[0].to_bucket_name).toBe('Investimentos');
    expect(result.data[0].reason).toBe('CASCADE_INSUFFICIENT_BALANCE');
  });

  test('retorna múltiplos pares ordenados', async () => {
    const pair1 = makeMockInternalPair('pair-1', {
      date: yesterday,
      amount: 100,
    });
    const pair2 = makeMockInternalPair('pair-2', {
      date: now,
      amount: 200,
    });
    const db = buildDb({ pairs: [pair2, pair1] });

    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].transfer_pair_id).toBe('pair-2');
    expect(result.data[1].transfer_pair_id).toBe('pair-1');
  });

  test('paginação retorna o subconjunto correto', async () => {
    const pairs = [
      makeMockInternalPair('pair-1', { date: twoDaysAgo }),
      makeMockInternalPair('pair-2', { date: yesterday }),
      makeMockInternalPair('pair-3', { date: now }),
    ];
    const db = buildDb({ pairs: [pairs[2], pairs[1], pairs[0]] });

    const page1 = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 2,
    });

    expect(page1.data).toHaveLength(2);
    expect(page1.meta.total).toBe(3);
    expect(page1.meta.page).toBe(1);
    expect(page1.meta.limit).toBe(2);

    const page2 = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 2,
      limit: 2,
    });

    expect(page2.data).toHaveLength(1);
    expect(page2.meta.total).toBe(3);
    expect(page2.meta.page).toBe(2);
  });

  test('retorna date como ISO string', async () => {
    const pair = makeMockInternalPair('pair-1', { date: now });
    const db = buildDb({ pairs: [pair] });

    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 20,
    });

    expect(result.data[0].date).toBe(now.toISOString());
  });

  test('retorna página vazia quando page excede total', async () => {
    const pair = makeMockInternalPair('pair-1');
    const db = buildDb({ pairs: [pair] });

    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 5,
      limit: 20,
    });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(1);
  });
});
