import { AppError, ErrorCode } from '@errors/app-error';
import { getCurrentInboxBalance } from '@features/transactions/usecases/get-current-inbox-balance';
import type { PrismaClient } from '@prisma/client';

interface InboxDistributionItem {
  bucket_id: string;
  amount: number;
}

interface DistributeInboxBalanceInput {
  workspaceId: string;
  distributions: InboxDistributionItem[];
}

export interface InboxDistributionResultItem {
  bucket_id: string;
  amount: number;
  transfer_pair_id: string;
}

export interface DistributeInboxBalanceResult {
  distributions: InboxDistributionResultItem[];
  available: number;
}

const DISTRIBUTION_DESCRIPTION = 'Distribuição livre do Caixa de Entrada';

export async function distributeInboxBalance(
  db: PrismaClient,
  { workspaceId, distributions }: DistributeInboxBalanceInput,
): Promise<DistributeInboxBalanceResult> {
  return db.$transaction(async (tx) => {
    const { inboxBucketId, currentInboxBalance } = await getCurrentInboxBalance(
      tx,
      workspaceId,
    );

    const requestedTotal = distributions.reduce(
      (sum, distribution) => sum + distribution.amount,
      0,
    );

    if (requestedTotal > currentInboxBalance) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        400,
        `Saldo insuficiente no INBOX. Disponível: ${currentInboxBalance}, solicitado: ${requestedTotal}`,
      );
    }

    const destinationBucketIds = [
      ...new Set(distributions.map((d) => d.bucket_id)),
    ];
    const destinationBuckets = await tx.bucket.findMany({
      where: {
        id: { in: destinationBucketIds },
        workspace_id: workspaceId,
      },
      select: { id: true, type: true },
    });

    if (destinationBuckets.length !== destinationBucketIds.length) {
      const existingIds = new Set(
        destinationBuckets.map((bucket) => bucket.id),
      );
      const missingBucketId = destinationBucketIds.find(
        (id) => !existingIds.has(id),
      );

      throw new AppError(
        ErrorCode.NOT_FOUND,
        404,
        `Caixa de propósito não encontrado: ${missingBucketId}`,
      );
    }

    const inboxAsDestination = destinationBuckets.find(
      (bucket) => bucket.type === 'INBOX',
    );
    if (inboxAsDestination) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        400,
        'O Caixa de Entrada (INBOX) não pode ser usado como destino da distribuição',
      );
    }

    const executedAt = new Date();
    const createdDistributions = distributions.map((distribution) => ({
      bucket_id: distribution.bucket_id,
      amount: distribution.amount,
      transfer_pair_id: crypto.randomUUID(),
    }));

    await tx.transaction.createMany({
      data: createdDistributions.flatMap((distribution) => [
        {
          workspace_id: workspaceId,
          bucket_id: inboxBucketId,
          type: 'EXPENSE' as const,
          amount: distribution.amount,
          description: DISTRIBUTION_DESCRIPTION,
          date: executedAt,
          is_paid: true,
          internal_type: 'DISTRIBUTION' as const,
          transfer_pair_id: distribution.transfer_pair_id,
        },
        {
          workspace_id: workspaceId,
          bucket_id: distribution.bucket_id,
          type: 'INCOME' as const,
          amount: distribution.amount,
          description: DISTRIBUTION_DESCRIPTION,
          date: executedAt,
          is_paid: true,
          internal_type: 'DISTRIBUTION' as const,
          transfer_pair_id: distribution.transfer_pair_id,
        },
      ]),
    });

    return {
      distributions: createdDistributions,
      available: currentInboxBalance - requestedTotal,
    };
  });
}
