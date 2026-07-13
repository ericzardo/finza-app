import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { updateTransaction } from './update-transaction';

const now = new Date('2026-01-15T10:00:00.000Z');

function makeMockTransaction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'txn-id',
    workspace_id: 'ws-id',
    type: 'EXPENSE' as const,
    amount: { toNumber: () => 150, valueOf: () => 150 } as unknown as number,
    description: 'Almoço',
    date: now,
    is_paid: true,
    internal_type: null,
    transfer_pair_id: null,
    bucket_id: 'bucket-id',
    bank_account_id: null,
    credit_card_id: null,
    category_id: null,
    invoice_id: null,
    source_transaction_id: null,
    transaction_pattern_id: null,
    installment_number: null,
    canceled_at: null,
    canceled_by: null,
    cancellation_reason: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

interface BuildDbOptions {
  existingTransaction?: ReturnType<typeof makeMockTransaction> | null;
  bucketFindFirst?: unknown;
  bucketFindUnique?: unknown;
  // Transações existentes no bucket para getBucketBalance (excluindo a principal)
  existingTransactions?: Array<{ type: string; amount: number }>;
  onCreateMany?: (data: unknown) => void;
  onDeleteMany?: (args: unknown) => void;
}

function buildDb(opts: BuildDbOptions = {}) {
  const {
    existingTransaction = makeMockTransaction(),
    bucketFindFirst,
    bucketFindUnique,
    existingTransactions = [],
    onCreateMany,
    onDeleteMany,
  } = opts;

  const tx = {
    bucket: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        if (bucketFindFirst !== undefined) return bucketFindFirst;
        if (where.type === 'INBOX')
          return { id: 'inbox-id', workspace_id: 'ws-id', type: 'INBOX' };
        return { id: 'bucket-id', workspace_id: 'ws-id', type: 'SPENDING' };
      },
      findUnique: async () =>
        bucketFindUnique !== undefined
          ? bucketFindUnique
          : { id: 'bucket-id', type: 'SPENDING' },
    },
    transaction: {
      deleteMany: async (args: unknown) => {
        onDeleteMany?.(args);
        return { count: 0 };
      },
      update: async () => makeMockTransaction(opts.existingTransaction ?? {}),
      groupBy: async ({ where }: { where: Record<string, unknown> }) => {
        let filtered = existingTransactions;
        const excludedId = (where.id as Record<string, unknown> | undefined)?.not;

        if (excludedId) {
          filtered = existingTransactions.filter(
            (transaction) =>
              (transaction as { id?: string }).id !== excludedId,
          );
        }

        const grouped = new Map<string, number>();

        for (const transaction of filtered) {
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
        existingTransactions.map((t) => ({
          type: t.type,
          amount: { toNumber: () => t.amount, valueOf: () => t.amount },
        })),
      createMany: async (args: unknown) => {
        onCreateMany?.(args);
        return { count: 2 };
      },
    },
  };

  return {
    bucket: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        if (bucketFindFirst !== undefined) return bucketFindFirst;
        if (where.type === 'INBOX')
          return { id: 'inbox-id', workspace_id: 'ws-id', type: 'INBOX' };
        return { id: 'bucket-id', workspace_id: 'ws-id', type: 'SPENDING' };
      },
    },
    transaction: {
      findUnique: async () => existingTransaction,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
  } as unknown as PrismaClient;
}

describe('updateTransaction', () => {
  test('lança NOT_FOUND quando transação não existe', async () => {
    const db = buildDb({ existingTransaction: null });

    await expect(
      updateTransaction(db, { workspaceId: 'ws-id', transactionId: 'txn-id' }),
    ).rejects.toThrow('Transação não encontrada');
  });

  test('lança NOT_FOUND quando transação pertence a outro workspace', async () => {
    const db = buildDb({
      existingTransaction: makeMockTransaction({ workspace_id: 'other-ws' }),
    });

    await expect(
      updateTransaction(db, { workspaceId: 'ws-id', transactionId: 'txn-id' }),
    ).rejects.toThrow('Transação não encontrada');
  });

  test('lança NOT_FOUND quando novo bucket_id não pertence ao workspace', async () => {
    const db = buildDb({ bucketFindFirst: null });

    await expect(
      updateTransaction(db, {
        workspaceId: 'ws-id',
        transactionId: 'txn-id',
        bucket_id: 'wrong-bucket',
      }),
    ).rejects.toThrow('Caixa de propósito não encontrado');
  });

  test('serializa amount como number e datas como ISO', async () => {
    const db = buildDb();
    const result = await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      description: 'Jantar',
    });

    expect(typeof result.amount).toBe('number');
    expect(result.date).toBe(now.toISOString());
    expect(result.created_at).toBe(now.toISOString());
  });

  // --- Cascata ---

  test('[Cascata] sempre deleta internals anteriores ao atualizar', async () => {
    let deleteManyArgs: unknown;
    const db = buildDb({
      existingTransactions: [{ type: 'INCOME', amount: 200 }],
      onDeleteMany: (args) => {
        deleteManyArgs = args;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      amount: 100,
    });

    expect(deleteManyArgs).toMatchObject({
      where: { source_transaction_id: 'txn-id' },
    });
  });

  test('[Cascata] não dispara quando saldo é suficiente após update', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransactions: [{ type: 'INCOME', amount: 200 }],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      amount: 150,
    });

    expect(cascadaCalled).toBe(false);
  });

  test('[Cascata] dispara quando novo amount gera déficit', async () => {
    let createdPairs: unknown[] = [];
    const db = buildDb({
      existingTransactions: [{ type: 'INCOME', amount: 50 }],
      onCreateMany: (args) => {
        createdPairs = (args as { data: unknown[] }).data;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      amount: 200,
    });

    const expense = (createdPairs as Array<Record<string, unknown>>).find(
      (t) => t.type === 'EXPENSE',
    );
    expect(expense?.amount).toBe(150); // déficit = 200 - 50
  });

  test('[Cascata] dispara quando is_paid muda de false para true com déficit', async () => {
    let createdPairs: unknown[] = [];
    const db = buildDb({
      existingTransaction: makeMockTransaction({ is_paid: false }),
      existingTransactions: [],
      onCreateMany: (args) => {
        createdPairs = (args as { data: unknown[] }).data;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      is_paid: true,
    });

    expect(createdPairs).toHaveLength(2);
    const expense = (createdPairs as Array<Record<string, unknown>>).find(
      (t) => t.type === 'EXPENSE',
    );
    expect(expense?.amount).toBe(150); // deficit total = amount = 150
  });

  test('[Cascata] não dispara quando is_paid é false após update', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransactions: [],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      is_paid: false,
    });

    expect(cascadaCalled).toBe(false);
  });

  test('[Cascata] não dispara quando bucket efetivo é INBOX', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransaction: makeMockTransaction({ bucket_id: 'inbox-id' }),
      bucketFindUnique: { id: 'inbox-id', type: 'INBOX' },
      existingTransactions: [],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      amount: 200,
    });

    expect(cascadaCalled).toBe(false);
  });

  test('[Cascata] não dispara para INCOME após update', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransaction: makeMockTransaction({ type: 'INCOME' }),
      existingTransactions: [],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await updateTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
      amount: 999,
    });

    expect(cascadaCalled).toBe(false);
  });
});
