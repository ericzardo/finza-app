import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { createTransaction } from './create-transaction';

const now = new Date('2026-01-15T10:00:00.000Z');

const baseInput = {
  workspaceId: 'ws-id',
  type: 'EXPENSE' as const,
  amount: 150,
  description: 'Almoço',
  date: now,
  is_paid: true,
};

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
  bucketFindFirst?: unknown;
  bankAccountFindFirst?: unknown;
  creditCardFindFirst?: unknown;
  categoryFindFirst?: unknown;
  // Transações existentes no bucket para cálculo de saldo (getBucketBalance)
  existingTransactions?: Array<{ type: string; amount: number }>;
  onCreateMany?: (data: unknown) => void;
}

function buildDb(opts: BuildDbOptions = {}) {
  const {
    bucketFindFirst,
    bankAccountFindFirst,
    creditCardFindFirst,
    categoryFindFirst,
    existingTransactions = [],
    onCreateMany,
  } = opts;

  const bucketFindFirstFn = async ({
    where,
  }: {
    where: Record<string, unknown>;
  }) => {
    if (bucketFindFirst !== undefined) return bucketFindFirst;
    if (where.type === 'INBOX')
      return { id: 'inbox-id', workspace_id: 'ws-id', type: 'INBOX' };
    return { id: 'bucket-id', workspace_id: 'ws-id', type: 'SPENDING' };
  };

  // tx mock (usado dentro de $transaction)
  const tx = {
    bucket: {
      findFirst: bucketFindFirstFn,
    },
    transaction: {
      create: async () => makeMockTransaction(),
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
    bucket: { findFirst: bucketFindFirstFn },
    bankAccount: {
      findFirst: async () =>
        bankAccountFindFirst !== undefined
          ? bankAccountFindFirst
          : { id: 'bank-id' },
    },
    creditCard: {
      findFirst: async () =>
        creditCardFindFirst !== undefined
          ? creditCardFindFirst
          : { id: 'card-id' },
    },
    category: {
      findFirst: async () =>
        categoryFindFirst !== undefined ? categoryFindFirst : { id: 'cat-id' },
    },
    transaction: {
      create: async () => makeMockTransaction(),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
  } as unknown as PrismaClient;
}

describe('createTransaction', () => {
  // --- Testes existentes ---

  test('usa o INBOX quando bucket_id não é informado', async () => {
    const db = buildDb();
    const result = await createTransaction(db, baseInput);

    expect(result.bucket_id).toBe('bucket-id');
    expect(result.id).toBe('txn-id');
    expect(result.amount).toBe(150);
  });

  test('usa o bucket_id fornecido quando válido', async () => {
    const db = buildDb();
    const result = await createTransaction(db, {
      ...baseInput,
      bucket_id: 'custom-bucket-id',
    });

    expect(result.bucket_id).toBe('bucket-id');
  });

  test('lança NOT_FOUND quando bucket_id não pertence ao workspace', async () => {
    const db = buildDb({ bucketFindFirst: null });

    await expect(
      createTransaction(db, { ...baseInput, bucket_id: 'wrong-bucket' }),
    ).rejects.toThrow('Caixa de propósito não encontrado');
  });

  test('lança NOT_FOUND quando INBOX não existe no workspace', async () => {
    const db = buildDb({ bucketFindFirst: null });

    await expect(createTransaction(db, baseInput)).rejects.toThrow(
      'Caixa de Entrada (INBOX) não encontrado no workspace',
    );
  });

  test('lança NOT_FOUND quando bank_account_id não pertence ao workspace', async () => {
    const db = buildDb({ bankAccountFindFirst: null });

    await expect(
      createTransaction(db, { ...baseInput, bank_account_id: 'bank-wrong' }),
    ).rejects.toThrow('Conta bancária não encontrada');
  });

  test('lança NOT_FOUND quando credit_card_id não pertence ao workspace', async () => {
    const db = buildDb({ creditCardFindFirst: null });

    await expect(
      createTransaction(db, { ...baseInput, credit_card_id: 'card-wrong' }),
    ).rejects.toThrow('Cartão de crédito não encontrado');
  });

  test('lança NOT_FOUND quando category_id não pertence ao workspace', async () => {
    const db = buildDb({ categoryFindFirst: null });

    await expect(
      createTransaction(db, { ...baseInput, category_id: 'cat-wrong' }),
    ).rejects.toThrow('Categoria não encontrada');
  });

  test('serializa amount como number (não Decimal)', async () => {
    const db = buildDb();
    const result = await createTransaction(db, baseInput);

    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBe(150);
  });

  test('serializa datas como ISO string', async () => {
    const db = buildDb();
    const result = await createTransaction(db, baseInput);

    expect(result.date).toBe(now.toISOString());
    expect(result.created_at).toBe(now.toISOString());
  });

  // --- Cascata ---

  test('[Cascata] não dispara quando saldo é suficiente', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransactions: [{ type: 'INCOME', amount: 200 }],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await createTransaction(db, {
      ...baseInput,
      bucket_id: 'bucket-id',
      amount: 150,
    });

    expect(cascadaCalled).toBe(false);
  });

  test('[Cascata] dispara cobrindo déficit total quando saldo é zero', async () => {
    let createdPairs: unknown[] = [];
    const db = buildDb({
      existingTransactions: [],
      onCreateMany: (args) => {
        createdPairs = (args as { data: unknown[] }).data;
      },
    });

    await createTransaction(db, {
      ...baseInput,
      bucket_id: 'bucket-id',
      amount: 150,
    });

    expect(createdPairs).toHaveLength(2);
    const expense = (createdPairs as Array<Record<string, unknown>>).find(
      (t) => t.type === 'EXPENSE',
    );
    const income = (createdPairs as Array<Record<string, unknown>>).find(
      (t) => t.type === 'INCOME',
    );
    expect(expense?.amount).toBe(150);
    expect(income?.amount).toBe(150);
    expect(expense?.bucket_id).toBe('inbox-id');
    expect(income?.bucket_id).toBe('bucket-id');
    expect(expense?.transfer_pair_id).toBe(income?.transfer_pair_id);
    expect(expense?.internal_type).toBe('CASCADE');
    expect(income?.internal_type).toBe('CASCADE');
    expect(expense?.source_transaction_id).toBe('txn-id');
  });

  test('[Cascata] cobre apenas o déficit quando há saldo parcial', async () => {
    let createdPairs: unknown[] = [];
    const db = buildDb({
      existingTransactions: [{ type: 'INCOME', amount: 50 }],
      onCreateMany: (args) => {
        createdPairs = (args as { data: unknown[] }).data;
      },
    });

    await createTransaction(db, {
      ...baseInput,
      bucket_id: 'bucket-id',
      amount: 150,
    });

    const expense = (createdPairs as Array<Record<string, unknown>>).find(
      (t) => t.type === 'EXPENSE',
    );
    expect(expense?.amount).toBe(100); // déficit = 150 - 50
  });

  test('[Cascata] não dispara quando transação é EXPENSE pendente (is_paid: false)', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransactions: [],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await createTransaction(db, {
      ...baseInput,
      bucket_id: 'bucket-id',
      is_paid: false,
    });

    expect(cascadaCalled).toBe(false);
  });

  test('[Cascata] não dispara quando bucket é INBOX', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransactions: [],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    // Sem bucket_id → vai para INBOX, Cascata não deve disparar
    await createTransaction(db, {
      ...baseInput,
      amount: 999,
    });

    expect(cascadaCalled).toBe(false);
  });

  test('[Cascata] não dispara para INCOME', async () => {
    let cascadaCalled = false;
    const db = buildDb({
      existingTransactions: [],
      onCreateMany: () => {
        cascadaCalled = true;
      },
    });

    await createTransaction(db, {
      ...baseInput,
      type: 'INCOME',
      bucket_id: 'bucket-id',
    });

    expect(cascadaCalled).toBe(false);
  });
});
