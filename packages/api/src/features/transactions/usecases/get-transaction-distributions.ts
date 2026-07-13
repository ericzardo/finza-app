import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';
import { getCurrentInboxBalance } from './get-current-inbox-balance';

interface GetTransactionDistributionsInput {
  transactionId: string;
  workspaceId: string;
}

export interface AllocationResult {
  id: string;
  transaction_id: string;
  bucket_id: string;
  amount: number;
  allocation_type: string;
  transfer_pair_id: string | null;
}

export interface GetTransactionDistributionsResult {
  total: number;
  distributed: number;
  available: number;
  allocations: AllocationResult[];
}

export async function getTransactionDistributions(
  db: PrismaClient,
  { transactionId, workspaceId }: GetTransactionDistributionsInput,
): Promise<GetTransactionDistributionsResult> {
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, workspace_id: workspaceId },
  });

  if (!transaction) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Transação não encontrada');
  }

  const allocations = await db.transactionAllocation.findMany({
    where: { transaction_id: transactionId },
  });

  const total = Number(transaction.amount);
  const distributed = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const transactionAvailable = total - distributed;
  const { currentInboxBalance } = await getCurrentInboxBalance(db, workspaceId);
  const available = Math.max(
    0,
    Math.min(transactionAvailable, currentInboxBalance),
  );

  return {
    total,
    distributed,
    available,
    allocations: allocations.map((a) => ({
      id: a.id,
      transaction_id: a.transaction_id,
      bucket_id: a.bucket_id,
      amount: Number(a.amount),
      allocation_type: a.allocation_type,
      transfer_pair_id: a.transfer_pair_id,
    })),
  };
}
