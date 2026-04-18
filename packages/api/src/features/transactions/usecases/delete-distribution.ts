import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';

interface DeleteDistributionInput {
  allocationId: string;
  transactionId: string;
  workspaceId: string;
}

export async function deleteDistribution(
  db: PrismaClient,
  { allocationId, transactionId, workspaceId }: DeleteDistributionInput,
): Promise<void> {
  const allocation = await db.transactionAllocation.findFirst({
    where: { id: allocationId, transaction_id: transactionId },
    include: {
      transaction: { select: { workspace_id: true } },
    },
  });

  if (!allocation || allocation.transaction.workspace_id !== workspaceId) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Alocação não encontrada');
  }

  if (!allocation.transfer_pair_id) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'Alocação sem vínculo com transações internas',
    );
  }

  await db.$transaction(async (tx) => {
    // Deletar transações internas vinculadas pelo transfer_pair_id
    await tx.transaction.deleteMany({
      where: {
        source_transaction_id: transactionId,
        internal_type: 'DISTRIBUTION',
        transfer_pair_id: allocation.transfer_pair_id,
      },
    });

    // Deletar a alocação
    await tx.transactionAllocation.delete({
      where: { id: allocationId },
    });
  });
}
