import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { getBucketBalance } from './get-bucket-balance';

function buildDb(
  transactions: Array<{ type: string; amount: number; id?: string }>,
) {
  return {
    transaction: {
      groupBy: async ({ where }: { where: Record<string, unknown> }) => {
        let filtered = transactions;
        const notFilter = (where.id as Record<string, unknown> | undefined)
          ?.not;
        if (notFilter) {
          filtered = transactions.filter((t) => t.id !== notFilter);
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
          _sum: {
            amount: { toNumber: () => amount, valueOf: () => amount },
          },
        }));
      },
    },
  } as unknown as PrismaClient;
}

describe('getBucketBalance', () => {
  test('retorna 0 quando não há transações', async () => {
    const db = buildDb([]);
    const balance = await getBucketBalance(db, 'bucket-id');
    expect(balance).toBe(0);
  });

  test('soma INCOME corretamente', async () => {
    const db = buildDb([
      { type: 'INCOME', amount: 100 },
      { type: 'INCOME', amount: 50 },
    ]);
    const balance = await getBucketBalance(db, 'bucket-id');
    expect(balance).toBe(150);
  });

  test('subtrai EXPENSE corretamente', async () => {
    const db = buildDb([
      { type: 'INCOME', amount: 200 },
      { type: 'EXPENSE', amount: 80 },
    ]);
    const balance = await getBucketBalance(db, 'bucket-id');
    expect(balance).toBe(120);
  });

  test('retorna negativo quando despesas superam receitas', async () => {
    const db = buildDb([
      { type: 'INCOME', amount: 50 },
      { type: 'EXPENSE', amount: 200 },
    ]);
    const balance = await getBucketBalance(db, 'bucket-id');
    expect(balance).toBe(-150);
  });

  test('ignora TRANSFER no cálculo', async () => {
    const db = buildDb([
      { type: 'INCOME', amount: 100 },
      { type: 'TRANSFER', amount: 999 },
    ]);
    const balance = await getBucketBalance(db, 'bucket-id');
    expect(balance).toBe(100);
  });

  test('inclui distribuições internas no saldo real do bucket', async () => {
    const db = buildDb([
      { type: 'INCOME', amount: 300 },
      { type: 'EXPENSE', amount: 50 },
      { type: 'INCOME', amount: 120 },
    ]);

    const balance = await getBucketBalance(db, 'bucket-id');

    expect(balance).toBe(370);
  });

  test('exclui transação pelo excludeTransactionId', async () => {
    const db = buildDb([
      { id: 'txn-1', type: 'EXPENSE', amount: 150 },
      { id: 'txn-2', type: 'INCOME', amount: 50 },
    ]);
    // Sem exclusão: 50 - 150 = -100
    const balanceFull = await getBucketBalance(db, 'bucket-id');
    expect(balanceFull).toBe(-100);

    // Excluindo txn-1 (EXPENSE 150): apenas INCOME 50 → saldo = 50
    const balanceExcluded = await getBucketBalance(db, 'bucket-id', {
      excludeTransactionId: 'txn-1',
    });
    expect(balanceExcluded).toBe(50);
  });
});
