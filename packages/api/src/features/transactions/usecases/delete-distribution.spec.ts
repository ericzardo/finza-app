import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { deleteDistribution } from './delete-distribution';

const mockAllocation = {
  id: 'alloc-id',
  transaction_id: 'txn-id',
  bucket_id: 'dest-bucket',
  amount: 200,
  allocation_type: 'DISTRIBUTION',
  transfer_pair_id: 'pair-id',
  transaction: { workspace_id: 'ws-id' },
};

function buildDb(allocation: unknown) {
  const deleteManyCalls: unknown[] = [];
  const deleteCalls: string[] = [];

  const txProxy = {
    transaction: {
      deleteMany: async (args: unknown) => {
        deleteManyCalls.push(args);
        return { count: 2 };
      },
    },
    transactionAllocation: {
      delete: async ({ where }: { where: { id: string } }) => {
        deleteCalls.push(where.id);
        return mockAllocation;
      },
    },
  };

  const db = {
    transactionAllocation: {
      findFirst: async () => allocation,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(txProxy),
  } as unknown as PrismaClient;

  return { db, deleteManyCalls, deleteCalls };
}

describe('deleteDistribution', () => {
  test('deleta alocação e transações internas com sucesso', async () => {
    const { db, deleteManyCalls, deleteCalls } = buildDb(mockAllocation);

    await deleteDistribution(db, {
      allocationId: 'alloc-id',
      transactionId: 'txn-id',
      workspaceId: 'ws-id',
    });

    expect(deleteManyCalls).toHaveLength(1);
    const deleteWhere = (
      deleteManyCalls[0] as { where: Record<string, unknown> }
    ).where;
    expect(deleteWhere.source_transaction_id).toBe('txn-id');
    expect(deleteWhere.internal_type).toBe('DISTRIBUTION');
    expect(deleteWhere.transfer_pair_id).toBe('pair-id');
    expect(deleteCalls).toEqual(['alloc-id']);
  });

  test('lança NOT_FOUND quando alocação não existe', async () => {
    const { db } = buildDb(null);

    await expect(
      deleteDistribution(db, {
        allocationId: 'alloc-inexistente',
        transactionId: 'txn-id',
        workspaceId: 'ws-id',
      }),
    ).rejects.toThrow('Alocação não encontrada');
  });

  test('lança NOT_FOUND quando alocação pertence a outro workspace', async () => {
    const { db } = buildDb({
      ...mockAllocation,
      transaction: { workspace_id: 'outro-ws' },
    });

    await expect(
      deleteDistribution(db, {
        allocationId: 'alloc-id',
        transactionId: 'txn-id',
        workspaceId: 'ws-id',
      }),
    ).rejects.toThrow('Alocação não encontrada');
  });
});
