import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { createDistribution } from './create-distribution';

const now = new Date('2026-01-15T10:00:00.000Z');

function mockTransaction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'txn-id',
    workspace_id: 'ws-id',
    type: 'INCOME',
    amount: { toNumber: () => 500, valueOf: () => 500 } as unknown as number,
    description: 'Salário',
    date: now,
    is_paid: true,
    internal_type: null,
    transfer_pair_id: null,
    bucket_id: 'inbox-id',
    bucket: { id: 'inbox-id', workspace_id: 'ws-id', type: 'INBOX' },
    bank_account_id: null,
    credit_card_id: null,
    category_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

interface BuildDbOptions {
  transaction?: unknown;
  existingAllocations?: Array<{ amount: number }>;
  bucketExists?: boolean;
}

function buildDb(opts: BuildDbOptions = {}) {
  const {
    transaction = mockTransaction(),
    existingAllocations = [],
    bucketExists = true,
  } = opts;

  let allocationCreateCalls: unknown[] = [];
  let transactionCreateManyCalls: unknown[] = [];

  const txProxy = {
    transactionAllocation: {
      create: async (args: { data: Record<string, unknown> }) => {
        allocationCreateCalls.push(args.data);
        return {
          id: `alloc-${allocationCreateCalls.length}`,
          transaction_id: args.data.transaction_id,
          bucket_id: args.data.bucket_id,
          amount: {
            toNumber: () => args.data.amount,
            valueOf: () => args.data.amount,
          },
          allocation_type: args.data.allocation_type,
          transfer_pair_id: args.data.transfer_pair_id,
        };
      },
    },
    transaction: {
      createMany: async (args: unknown) => {
        transactionCreateManyCalls.push(args);
        return { count: 2 };
      },
    },
  };

  const db = {
    transaction: {
      findFirst: async () => transaction,
    },
    transactionAllocation: {
      findMany: async () =>
        existingAllocations.map((a) => ({
          amount: {
            toNumber: () => a.amount,
            valueOf: () => a.amount,
          },
        })),
    },
    bucket: {
      findFirst: async () =>
        bucketExists
          ? { id: 'dest-bucket', workspace_id: 'ws-id', type: 'SPENDING' }
          : null,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(txProxy),
  } as unknown as PrismaClient;

  return { db, allocationCreateCalls, transactionCreateManyCalls };
}

describe('createDistribution', () => {
  test('cria distribuição válida', async () => {
    const { db, allocationCreateCalls, transactionCreateManyCalls } = buildDb();

    const result = await createDistribution(db, {
      transactionId: 'txn-id',
      workspaceId: 'ws-id',
      distributions: [{ bucketId: 'dest-bucket', amount: 200 }],
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].amount).toBe(200);
    expect(result.available).toBe(300);
    expect(allocationCreateCalls).toHaveLength(1);
    expect(transactionCreateManyCalls).toHaveLength(1);
  });

  test('lança BAD_REQUEST quando soma ultrapassa saldo disponível', async () => {
    const { db } = buildDb({
      existingAllocations: [{ amount: 400 }],
    });

    await expect(
      createDistribution(db, {
        transactionId: 'txn-id',
        workspaceId: 'ws-id',
        distributions: [{ bucketId: 'dest-bucket', amount: 200 }],
      }),
    ).rejects.toThrow('Saldo insuficiente para distribuição');
  });

  test('lança BAD_REQUEST quando transação não é INCOME', async () => {
    const { db } = buildDb({
      transaction: mockTransaction({ type: 'EXPENSE' }),
    });

    await expect(
      createDistribution(db, {
        transactionId: 'txn-id',
        workspaceId: 'ws-id',
        distributions: [{ bucketId: 'dest-bucket', amount: 100 }],
      }),
    ).rejects.toThrow('Apenas transações do tipo INCOME podem ser distribuídas');
  });

  test('lança BAD_REQUEST quando transação não está no INBOX', async () => {
    const { db } = buildDb({
      transaction: mockTransaction({
        bucket: { id: 'other-bucket', workspace_id: 'ws-id', type: 'SPENDING' },
      }),
    });

    await expect(
      createDistribution(db, {
        transactionId: 'txn-id',
        workspaceId: 'ws-id',
        distributions: [{ bucketId: 'dest-bucket', amount: 100 }],
      }),
    ).rejects.toThrow(
      'Apenas transações do Caixa de Entrada (INBOX) podem ser distribuídas',
    );
  });

  test('lança NOT_FOUND quando bucket destino não existe', async () => {
    const { db } = buildDb({ bucketExists: false });

    await expect(
      createDistribution(db, {
        transactionId: 'txn-id',
        workspaceId: 'ws-id',
        distributions: [{ bucketId: 'bucket-inexistente', amount: 100 }],
      }),
    ).rejects.toThrow('Caixa de propósito não encontrado');
  });

  test('lança NOT_FOUND quando transação não existe', async () => {
    const { db } = buildDb({ transaction: null });

    await expect(
      createDistribution(db, {
        transactionId: 'txn-nao-existe',
        workspaceId: 'ws-id',
        distributions: [{ bucketId: 'dest-bucket', amount: 100 }],
      }),
    ).rejects.toThrow('Transação não encontrada');
  });
});
