import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';
import { type BucketItem, serializeBucket } from './create-bucket';

interface UpdateBucketInput {
  workspaceId: string;
  bucketId: string;
  name?: string;
  type?: 'SPENDING' | 'INVESTMENT';
  allocation_percentage?: number;
}

export async function updateBucket(
  db: PrismaClient,
  {
    workspaceId,
    bucketId,
    name,
    type,
    allocation_percentage,
  }: UpdateBucketInput,
): Promise<BucketItem> {
  const existing = await db.bucket.findFirst({
    where: { id: bucketId, workspace_id: workspaceId },
  });

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Caixa não encontrado');
  }

  if (existing.is_default) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      403,
      'O caixa INBOX não pode ser editado',
    );
  }

  const bucket = await db.bucket.update({
    where: { id: bucketId },
    data: { name, type, allocation_percentage },
  });

  return serializeBucket(bucket);
}
