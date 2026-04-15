import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { getTransactionDistributions } from './get-transaction-distributions';

const now = new Date('2026-01-15T10:00:00.000Z');

const mockTransaction = {
  id: 'txn-id',
  workspace_id: 'ws-id',
  type: 'INCOME' as const,
  amount: { toNumber: () => 500, valueOf: () => 500 } as unknown as number,
  description: 'Salário',
  date: now,
  is_paid: true,
  internal_type: null,
  transfer_pair_id: null,
  bucket_id: 'inbox-id',
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
};

function buildDb(
  transactionExists: boolean,
  allocations: Array<{
    id: string;
    bucket_id: string;
    amount: number;
    transfer_pair_id: string | null;
  }> = [],
  inboxBalance = 500,
) {
  return {
    bucket: {
      findFirst: async () => ({ id: 'inbox-id' }),
    },
    transaction: {
      findFirst: async () => (transactionExists ? mockTransaction : null),
      findMany: async () => [
        {
          type: inboxBalance >= 0 ? 'INCOME' : 'EXPENSE',
          amount: {
            toNumber: () => Math.abs(inboxBalance),
            valueOf: () => Math.abs(inboxBalance),
          },
        },
      ],
    },
    transactionAllocation: {
      findMany: async () =>
        allocations.map((a) => ({
          id: a.id,
          transaction_id: 'txn-id',
          bucket_id: a.bucket_id,
          amount: {
            toNumber: () => a.amount,
            valueOf: () => a.amount,
          },
          allocation_type: 'DISTRIBUTION',
          transfer_pair_id: a.transfer_pair_id,
        })),
    },
  } as unknown as PrismaClient;
}

describe('getTransactionDistributions', () => {
  test('retorna saldo completo quando não há distribuições', async () => {
    const db = buildDb(true);

    const result = await getTransactionDistributions(db, {
      transactionId: 'txn-id',
      workspaceId: 'ws-id',
    });

    expect(result.total).toBe(500);
    expect(result.distributed).toBe(0);
    expect(result.available).toBe(500);
    expect(result.allocations).toHaveLength(0);
  });

  test('retorna saldo correto com distribuições existentes', async () => {
    const db = buildDb(true, [
      {
        id: 'alloc-1',
        bucket_id: 'bucket-a',
        amount: 200,
        transfer_pair_id: 'pair-1',
      },
      {
        id: 'alloc-2',
        bucket_id: 'bucket-b',
        amount: 100,
        transfer_pair_id: 'pair-2',
      },
    ]);

    const result = await getTransactionDistributions(db, {
      transactionId: 'txn-id',
      workspaceId: 'ws-id',
    });

    expect(result.total).toBe(500);
    expect(result.distributed).toBe(300);
    expect(result.available).toBe(200);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].amount).toBe(200);
    expect(result.allocations[1].amount).toBe(100);
  });

  test('limita o available pelo saldo real do inbox', async () => {
    const db = buildDb(
      true,
      [
        {
          id: 'alloc-1',
          bucket_id: 'bucket-a',
          amount: 100,
          transfer_pair_id: 'pair-1',
        },
      ],
      250,
    );

    const result = await getTransactionDistributions(db, {
      transactionId: 'txn-id',
      workspaceId: 'ws-id',
    });

    expect(result.total).toBe(500);
    expect(result.distributed).toBe(100);
    expect(result.available).toBe(250);
  });

  test('retorna available zerado quando o inbox está negativo', async () => {
    const db = buildDb(true, [], -25);

    const result = await getTransactionDistributions(db, {
      transactionId: 'txn-id',
      workspaceId: 'ws-id',
    });

    expect(result.available).toBe(0);
  });

  test('lança NOT_FOUND quando transação não existe', async () => {
    const db = buildDb(false);

    await expect(
      getTransactionDistributions(db, {
        transactionId: 'txn-nao-existe',
        workspaceId: 'ws-id',
      }),
    ).rejects.toThrow('Transação não encontrada');
  });
});
