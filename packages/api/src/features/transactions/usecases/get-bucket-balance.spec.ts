import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { getBucketBalance } from './get-bucket-balance';

function buildDb(
  transactions: Array<{ type: string; amount: number; id?: string }>,
) {
  return {
    transaction: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        let filtered = transactions;
        // Simula o filtro excludeTransactionId
        const notFilter = (where.id as Record<string, unknown> | undefined)
          ?.not;
        if (notFilter) {
          filtered = transactions.filter((t) => t.id !== notFilter);
        }
        return filtered.map((t) => ({
          type: t.type,
          amount: { toNumber: () => t.amount, valueOf: () => t.amount },
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
