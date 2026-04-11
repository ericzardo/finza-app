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
    internalType?: string;
  } = {},
) {
  const date = opts.date ?? now;
  const amount = opts.amount ?? 100;
  const fromBucket = opts.fromBucketName ?? 'Caixa de Entrada';
  const toBucket = opts.toBucketName ?? 'Investimentos';
  const internalType = opts.internalType ?? 'CASCADE';

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
      internal_type: internalType,
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
      internal_type: internalType,
      transfer_pair_id: transferPairId,
      bucket_id: 'invest-id',
      bucket: { name: toBucket },
      source_transaction_id: 'source-txn',
      created_at: date,
      updated_at: date,
    },
  ];
}

function makeMockSoloTransaction(
  id: string,
  opts: {
    date?: Date;
    amount?: number;
    bucketName?: string;
    internalType?: string;
    type?: 'INCOME' | 'EXPENSE';
    description?: string;
  } = {},
) {
  const date = opts.date ?? now;
  const amount = opts.amount ?? 500;
  const bucketName = opts.bucketName ?? 'Caixa de Entrada';
  const internalType = opts.internalType ?? 'BALANCE_ADJUSTMENT';
  const type = opts.type ?? 'INCOME';
  const description = opts.description ?? 'Ajuste de saldo inicial';

  return {
    id,
    workspace_id: 'ws-id',
    type,
    amount: {
      toNumber: () => amount,
      valueOf: () => amount,
    } as unknown as number,
    description,
    date,
    is_paid: true,
    internal_type: internalType,
    transfer_pair_id: null,
    bucket_id: 'inbox-id',
    bucket: { name: bucketName },
    source_transaction_id: null,
    created_at: date,
    updated_at: date,
  };
}

interface BuildDbOptions {
  pairs?: ReturnType<typeof makeMockInternalPair>[];
  solos?: ReturnType<typeof makeMockSoloTransaction>[];
}

function buildDb(opts: BuildDbOptions = {}) {
  const { pairs = [], solos = [] } = opts;
  const allPairedTransactions = pairs.flat();
  const allSoloTransactions = solos;

  return {
    transaction: {
      findMany: async (args: {
        where?: Record<string, unknown>;
        distinct?: string[];
        select?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
      }) => {
        // Distinct paired query
        if (args.distinct && args.where && 'transfer_pair_id' in args.where) {
          const tpFilter = args.where.transfer_pair_id;
          if (tpFilter && typeof tpFilter === 'object' && 'not' in tpFilter) {
            const seen = new Set<string>();
            return allPairedTransactions
              .filter((t) => {
                if (!t.transfer_pair_id || seen.has(t.transfer_pair_id))
                  return false;
                seen.add(t.transfer_pair_id);
                return true;
              })
              .map((t) => ({
                transfer_pair_id: t.transfer_pair_id,
                date: t.date,
              }));
          }
        }

        // Solo query (transfer_pair_id: null)
        if (args.where && 'transfer_pair_id' in args.where) {
          const tpFilter = args.where.transfer_pair_id;
          if (tpFilter === null) {
            return allSoloTransactions;
          }
          // Pair fetch by IDs
          if (tpFilter && typeof tpFilter === 'object' && 'in' in tpFilter) {
            const filter = tpFilter as { in: string[] };
            return allPairedTransactions.filter(
              (t) =>
                t.transfer_pair_id !== null &&
                filter.in.includes(t.transfer_pair_id),
            );
          }
        }

        return [...allPairedTransactions, ...allSoloTransactions];
      },
    },
  } as unknown as PrismaClient;
}

describe('listInternalTransactions', () => {
  test('retorna lista vazia quando não há transações internas', async () => {
    const db = buildDb({ pairs: [], solos: [] });
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
    expect(result.data[0].internal_type).toBe('CASCADE');
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

  test('inclui BALANCE_ADJUSTMENT como entrada solo (sem transfer_pair_id)', async () => {
    const solo = makeMockSoloTransaction('adj-1', {
      amount: 1500,
      bucketName: 'Caixa de Entrada',
      date: now,
    });
    const db = buildDb({ solos: [solo] });

    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('adj-1');
    expect(result.data[0].internal_type).toBe('BALANCE_ADJUSTMENT');
    expect(result.data[0].amount).toBe(1500);
    expect(result.data[0].transfer_pair_id).toBeNull();
    expect(result.data[0].from_bucket_name).toBeNull();
    expect(result.data[0].to_bucket_name).toBe('Caixa de Entrada');
    expect(result.data[0].description).toBe('Ajuste de saldo inicial');
  });

  test('mistura pares e solos ordenados por data', async () => {
    const pair = makeMockInternalPair('pair-1', {
      date: yesterday,
      amount: 100,
    });
    const solo = makeMockSoloTransaction('adj-1', {
      date: now,
      amount: 500,
    });
    const db = buildDb({ pairs: [pair], solos: [solo] });

    const result = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].internal_type).toBe('BALANCE_ADJUSTMENT');
    expect(result.data[0].date).toBe(now.toISOString());
    expect(result.data[1].internal_type).toBe('CASCADE');
    expect(result.data[1].date).toBe(yesterday.toISOString());
  });

  test('paginação funciona com mix de pares e solos', async () => {
    const pair1 = makeMockInternalPair('pair-1', { date: twoDaysAgo });
    const pair2 = makeMockInternalPair('pair-2', { date: now });
    const solo = makeMockSoloTransaction('adj-1', { date: yesterday });
    const db = buildDb({ pairs: [pair2, pair1], solos: [solo] });

    const page1 = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 1,
      limit: 2,
    });

    expect(page1.data).toHaveLength(2);
    expect(page1.meta.total).toBe(3);

    const page2 = await listInternalTransactions(db, {
      workspaceId: 'ws-id',
      page: 2,
      limit: 2,
    });

    expect(page2.data).toHaveLength(1);
    expect(page2.meta.total).toBe(3);
  });
});
