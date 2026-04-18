import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { getCurrentInboxBalance } from './get-current-inbox-balance';

interface BuildDbOptions {
  inboxBucketId?: string | null;
  transactions?: Array<{ type: string; amount: number }>;
}

function buildDb(opts: BuildDbOptions = {}) {
  const { inboxBucketId = 'inbox-id', transactions = [] } = opts;

  return {
    bucket: {
      findFirst: async () => (inboxBucketId ? { id: inboxBucketId } : null),
    },
    transaction: {
      groupBy: async () => {
        const grouped = new Map<string, number>();

        for (const transaction of transactions) {
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
        transactions.map((transaction) => ({
          type: transaction.type,
          amount: {
            toNumber: () => transaction.amount,
            valueOf: () => transaction.amount,
          },
        })),
    },
  } as unknown as PrismaClient;
}

describe('getCurrentInboxBalance', () => {
  test('retorna o id do inbox e o saldo real calculado pelas transações', async () => {
    const db = buildDb({
      inboxBucketId: 'inbox-id',
      transactions: [
        { type: 'INCOME', amount: 1000 },
        { type: 'EXPENSE', amount: 250 },
        { type: 'EXPENSE', amount: 100 },
      ],
    });

    const result = await getCurrentInboxBalance(db, 'ws-id');

    expect(result).toEqual({
      inboxBucketId: 'inbox-id',
      currentInboxBalance: 650,
    });
  });

  test('lança NOT_FOUND quando o workspace não possui inbox', async () => {
    const db = buildDb({ inboxBucketId: null });

    await expect(getCurrentInboxBalance(db, 'ws-id')).rejects.toThrow(
      'Caixa de Entrada (INBOX) não encontrado no workspace',
    );
  });
});
