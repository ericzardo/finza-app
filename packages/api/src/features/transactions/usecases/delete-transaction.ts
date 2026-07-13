import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';

interface DeleteTransactionInput {
  workspaceId: string;
  transactionId: string;
}

export async function deleteTransaction(
  db: PrismaClient,
  { workspaceId, transactionId }: DeleteTransactionInput,
): Promise<void> {
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, workspace_id: workspaceId },
  });

  if (!transaction) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Transação não encontrada');
  }

  // Allocations são removidas automaticamente pelo Prisma (onDelete: Cascade)
  await db.transaction.delete({ where: { id: transactionId } });
}
