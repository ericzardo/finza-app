import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { deleteTransaction } from './delete-transaction';

const now = new Date('2026-01-15T10:00:00.000Z');

const mockTransaction = {
  id: 'txn-id',
  workspace_id: 'ws-id',
  type: 'EXPENSE' as const,
  amount: 150,
  description: 'Almoço',
  date: now,
  is_paid: true,
  bucket_id: 'bucket-id',
  bank_account_id: null,
  credit_card_id: null,
  category_id: null,
  invoice_id: null,
  transaction_pattern_id: null,
  installment_number: null,
  canceled_at: null,
  canceled_by: null,
  cancellation_reason: null,
  created_at: now,
  updated_at: now,
};

function buildDb(transactionExists: boolean) {
  const deleteCalls: string[] = [];

  const db = {
    transaction: {
      findFirst: async () => (transactionExists ? mockTransaction : null),
      delete: async ({ where }: { where: { id: string } }) => {
        deleteCalls.push(where.id);
        return mockTransaction;
      },
    },
  } as unknown as PrismaClient;

  return { db, deleteCalls };
}

describe('deleteTransaction', () => {
  test('deleta a transação com sucesso', async () => {
    const { db, deleteCalls } = buildDb(true);

    await deleteTransaction(db, {
      workspaceId: 'ws-id',
      transactionId: 'txn-id',
    });

    expect(deleteCalls).toEqual(['txn-id']);
  });

  test('lança NOT_FOUND quando transação não existe no workspace', async () => {
    const { db } = buildDb(false);

    await expect(
      deleteTransaction(db, {
        workspaceId: 'ws-id',
        transactionId: 'txn-nao-existe',
      }),
    ).rejects.toThrow('Transação não encontrada');
  });

  test('não deleta quando a transação pertence a outro workspace', async () => {
    const { deleteCalls } = buildDb(false);

    const db = {
      transaction: {
        findFirst: async ({ where }: { where: Record<string, unknown> }) => {
          // simula que a transação existe mas pertence a outro workspace
          if (where.workspace_id !== 'ws-id') return null;
          return null;
        },
        delete: async ({ where }: { where: { id: string } }) => {
          deleteCalls.push(where.id);
        },
      },
    } as unknown as PrismaClient;

    await expect(
      deleteTransaction(db, {
        workspaceId: 'ws-id',
        transactionId: 'txn-outro-workspace',
      }),
    ).rejects.toThrow('Transação não encontrada');

    expect(deleteCalls).toHaveLength(0);
  });
});
