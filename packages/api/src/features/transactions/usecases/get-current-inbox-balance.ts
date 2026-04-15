import { AppError, ErrorCode } from '@errors/app-error';
import type { Prisma, PrismaClient } from '@prisma/client';
import { getBucketBalance } from './get-bucket-balance';

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface CurrentInboxBalanceResult {
  inboxBucketId: string;
  currentInboxBalance: number;
}

export async function getCurrentInboxBalance(
  db: DbClient,
  workspaceId: string,
): Promise<CurrentInboxBalanceResult> {
  const inboxBucket = await db.bucket.findFirst({
    where: { workspace_id: workspaceId, type: 'INBOX' },
    select: { id: true },
  });

  if (!inboxBucket) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      404,
      'Caixa de Entrada (INBOX) não encontrado no workspace',
    );
  }

  const currentInboxBalance = await getBucketBalance(db, inboxBucket.id);

  return {
    inboxBucketId: inboxBucket.id,
    currentInboxBalance,
  };
}
